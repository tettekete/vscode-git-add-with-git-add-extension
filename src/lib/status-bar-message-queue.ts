import * as vscode from 'vscode';

export class StatusBarMessageQueue
{
	private static instance: StatusBarMessageQueue | null = null;

	private queue: { message: string; timeout: number; priority: number }[] = [];
	private isProcessing = false;
	private currentTimeout: NodeJS.Timeout | null = null;
	// Skip setting for identical messages
	private skipDuplicateMessages = true;

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
		this.queue.sort((a, b) => b.priority - a.priority);

		if (!this.isProcessing) {
			this.processQueue();
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
}
