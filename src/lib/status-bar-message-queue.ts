import * as vscode from 'vscode';

export class StatusBarMessageQueue
{
	private static instance: StatusBarMessageQueue | null = null;

	private queue: { message: string; timeout: number; priority: number }[] = [];
	private isProcessing = false;
	private currentTimeout: NodeJS.Timeout | null = null;
	// Skip setting for identical messages
	private skipDuplicateMessages = true;
	private maxTimeout: number = 10000;
	private lowPriorityThreshold = 99;

	// Since this is a singleton implementation, the constructor should be private.
	private constructor() {}

	/**
	 * Returns Singleton instance
	 */
	public static getInstance(): StatusBarMessageQueue
	{
		if( ! this.instance )
		{
			this.instance = new StatusBarMessageQueue();
		}
		return this.instance;
	}

	/**
	 * Enque message
	 * @param {string} message - message
	 * @param {number} timeout - timeout(ms)
	 */
    public async enqueue(message: string, timeout: number, priority = 0): Promise<void>
	{
		if (this.skipDuplicateMessages && this.queue.some(q => q.message === message))
		{
			return;
		}

		this.queue.push({ message, timeout, priority });
		this.adjustTimeouts();
		this.queue.sort((a, b) => b.priority - a.priority);

		if (!this.isProcessing) {
			this.processQueue();
		}
	}

	/**
	 * Adjust so that the total timeout for priorities below or equal to lowPriorityThreshold
	 * does not exceed maxTimeout.
	 * However, ensure a minimum display time of 100 ms for each message.
	 */
	private adjustTimeouts(): void {
		let totalTimeout = this.queue
			.filter((item) =>
			{
				return item.priority <= this.lowPriorityThreshold;
			})
			.reduce( (sum, item) => sum + item.timeout, 0);

		if (totalTimeout > this.maxTimeout) {
			const coef = totalTimeout / this.maxTimeout ;

			this.queue = this.queue.map((item) =>
			{
				if( item.priority > this.lowPriorityThreshold )
				{
					return item;
				}

				const adjustedTime = Math.floor( item.timeout * coef );
				const adjustedTimeout = Math.max( adjustedTime, 100); // 最低100msを保証
				return { ...item, timeout: adjustedTimeout };
			});
		}
	}


	/**
	 * Clear the queue and display the message immediately.
	 * @param {string} message - message
	 * @param {number} timeout - timeout(ms)
	 */
	public showNow(message: string, timeout: number): void {
		if (this.currentTimeout)
		{
			clearTimeout(this.currentTimeout);
			this.currentTimeout = null;
		}

		this.queue = [{ message, timeout, priority: Infinity }];
		
		this.processQueue();
	}


	/**
	 * Process queues sequentially
	 */
	private async processQueue(): Promise<void>
	{
		this.isProcessing = true;

		while (this.queue.length > 0)
		{
			const { message, timeout } = this.queue.shift()!;

			vscode.window.setStatusBarMessage(message , timeout);

			this.currentTimeout = setTimeout(
				() => {},
				timeout
			);

			// wait timeout
			await new Promise(resolve => setTimeout(resolve, timeout));
		}

		this.isProcessing = false;
		this.currentTimeout = null;
	}

	/**
	 * The setter method for 'Skip setting for identical messages'.
	 * @param {boolean} skip - enable skip when true
	 */
	public setSkipDuplicateMessages(skip: boolean)
	{
		this.skipDuplicateMessages = skip;
	}

	public setMaxTimeout( ms: number )
	{
		if( ms < 100 ){ return false;}

		this.maxTimeout = ms;

		return true;
	}
}
