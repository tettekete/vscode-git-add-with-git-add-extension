import * as assert from 'assert';
import parseGitDiff ,{ Chunk,ChangedFile } from 'parse-git-diff';
import { isChangedFile , isChunk } from '../lib/type-gurd/parse-git-diff';
import { MakePatchFromSelection } from '../lib/make-patch-from-selection';
import { LineRange } from '../lib/line-range';

const diff = `diff --git a/cat-and-aliens-report.md b/cat-and-aliens-report.md
index a8826c7..621a8f7 100644
--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -1,27 +1,25 @@
-# The History of Cats and Aliens: A Cosmic Tale
 
 ## Introduction
 
 For centuries, humanity has been fascinated by the enigmatic nature of cats and the possibility of
+extraterrestrial life. While these two subjects might seem worlds apart, there is a surprising
 connection that runs deeper than one might initially suspect. This document explores the
+intriguing history of how cats and aliens have been interwoven in myth, science, and speculative
 fiction.
 
 ## Ancient Myths and Legends
 
-cosmic origin.
-divine mystery. Some texts even describe how Bastet was said to come from the "stars," hinting at a
-gods. The goddess Bastet, a feline deity, was revered as a protector of the home and a symbol of
-especially those with unusual features like glowing eyes, were often considered emissaries of the
 The first records of cats being associated with celestial beings date back to ancient Egypt. Cats,
+especially those with unusual features like glowing eyes, were often considered emissaries of the
+gods. The goddess Bastet, a feline deity, was revered as a protector of the home and a symbol of
+divine mystery. Some texts even describe how Bastet was said to come from the "stars," hinting at a
+cosmic origin.
 
 ### Key Myths:
 
 - Bastet as a celestial protector
-- Bastet as a celestial protector
-- Black cats and astronomical events in Europe
 - Black cats and astronomical events in Europe
 - Feline omens in early Asian astronomy
-- Feline omens in early Asian astronomy
 
 In the medieval period, European folklore included tales of black cats appearing during strange
 astronomical events. These cats were sometimes linked to sorcery, but others believed they were
@@ -29,20 +27,22 @@ harbingers of visitors from beyond the skies. Such stories fed into an enduring
 between cats and the unknown.
 
 ## The Modern Era: UFOs and Cats
-
+ggggggg
 The modern UFO phenomenon, beginning in the 20th century, brought a new dimension to the
+cat-alien narrative. Reports from abductees occasionally mentioned cats behaving oddly during
+encounters with unidentified flying objects. Some speculated that cats might act as conduits for
 alien communication or as biological recording devices.
-
+ggggg
 ### Incident in New Mexico:
 
 - Sightings of strange lights in the sky
 - A family cat exhibiting erratic behavior
 - Speculation about extraterrestrial influence
 
-the in lights strange reporting family a involved Mexico New in incident peculiar a 1970s, the In
+In the 1970s, a peculiar incident in New Mexico involved a family reporting strange lights in the
 sky. Their cat, whom they described as unusually intelligent, began exhibiting erratic behavior,
-such While beings. extraterrestrial by "contacted" been had it that theorize to some leading
-their and cats surrounding mystique the to contributed have they unverified, remain claims
+leading some to theorize that it had been "contacted" by extraterrestrial beings. While such
+claims remain unverified, they have contributed to the mystique surrounding cats and their
 possible connection to aliens.
 
 ### Cats and UFO Activity Graph
`;

const parsedDiff		= parseGitDiff( diff );
const chunks:Chunk[]	= [];

for(const file of parsedDiff.files )
{
	if( ! isChangedFile( file ) )	{ continue; }

	for( const chunk of file.chunks )
	{
		if( ! isChunk( chunk) )	{ continue; }

		chunks.push( chunk );
	}
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MakePatchFromSelection Basic Tests
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

suite('MakePatchFromSelection Basic Tests', () =>
{
	test('Select line 4 to 6',()=>
	{
		const makePatchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: new LineRange( 4,6 )
		});

		const patch = makePatchFromSelection.getPatchString();
		const expect = `--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -3,6 +3,7 @@
 ## Introduction
 
 For centuries, humanity has been fascinated by the enigmatic nature of cats and the possibility of
+extraterrestrial life. While these two subjects might seem worlds apart, there is a surprising
 connection that runs deeper than one might initially suspect. This document explores the
 fiction.
 
`;
		assert.equal( typeof patch , 'string' , 'patch is string.');
		assert.equal( patch , expect );
	});

	test('Select line 20 to 21',()=>
	{
		const makePatchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: new LineRange( 20,21 )
		});

		const patch = makePatchFromSelection.getPatchString();
		const expect = `--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -17,8 +17,6 @@
 ### Key Myths:
 
 - Bastet as a celestial protector
-- Bastet as a celestial protector
-- Black cats and astronomical events in Europe
 - Black cats and astronomical events in Europe
 - Feline omens in early Asian astronomy
 - Feline omens in early Asian astronomy
`;
		assert.equal( typeof patch , 'string' , 'patch is string.');
		assert.equal( patch , expect );
	});

	test('Select line 34 to 36',()=>
	{
		const makePatchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: new LineRange( 34,36 )
		});

		const patch = makePatchFromSelection.getPatchString();
		const expect = `--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -32,7 +32,7 @@ harbingers of visitors from beyond the skies. Such stories fed into an enduring
 
 The modern UFO phenomenon, beginning in the 20th century, brought a new dimension to the
 alien communication or as biological recording devices.
-
+ggggg
 ### Incident in New Mexico:
 
 - Sightings of strange lights in the sky
`;

		assert.equal( typeof patch , 'string' , 'patch is string.');
		assert.equal( patch , expect );
	});

	test('Select line 1 to 1',()=>
	{
		const makePatchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: new LineRange( 1,1 )
		});

		const patch = makePatchFromSelection.getPatchString();
		const expect = `--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -1,4 +1,3 @@
-# The History of Cats and Aliens: A Cosmic Tale
 
 ## Introduction
 
`;

		assert.equal( typeof patch , 'string' , 'patch is string.');
		assert.equal( patch , expect );
	});
});


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MakePatchFromSelection modified in padding range.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

suite('MakePatchFromSelection modified in padding range.', () =>
{
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 1 deleted
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 1 deleted',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..0adfb37 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,4 +1,3 @@
-1: The first line is included in the padding.
 2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
`;
		test('Selected 1 to 2',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 1,2 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,4 +1,3 @@
-1: The first line is included in the padding.
 2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});

	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 1 deleted && added
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 1 deleted　&& added',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..c46f797 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,4 +1,4 @@
-1: The first line is included in the padding.
+1: Being first isn’t everything, unless it’s pizza delivery.
 2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
`;
		test('Selected 1 to 1',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 1,1 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,4 +1,4 @@
-1: The first line is included in the padding.
+1: Being first isn’t everything, unless it’s pizza delivery.
 2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});

		test('Selected 1 to 2',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 1,2 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,4 +1,4 @@
-1: The first line is included in the padding.
+1: Being first isn’t everything, unless it’s pizza delivery.
 2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});

	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 2 deleted
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 2 deleted',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..d5b6084 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,5 +1,4 @@
 1: The first line is included in the padding.
-2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
`;
		test('Selected 1 to 2',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 1,2 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,5 +1,4 @@
 1: The first line is included in the padding.
-2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});

	
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 2 deleted && added
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 2 deleted　&& added',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..9db2432 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,5 +1,5 @@
 1: The first line is included in the padding.
-2: The second line is also included in the padding.
+2: Second place: proof that you tried, but not too hard.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
`;
		test('Selected 2 to 2',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 2,2 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,5 +1,5 @@
 1: The first line is included in the padding.
-2: The second line is also included in the padding.
+2: Second place: proof that you tried, but not too hard.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});

	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 3 deleted
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 3 deleted',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..34605c9 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,6 +1,5 @@
 1: The first line is included in the padding.
 2: The second line is also included in the padding.
-3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
 6: The sixth line is also included in the footer padding if it consists of seven lines or less
`;
		test('Selected 2 to 3',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 2,3 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -1,6 +1,5 @@
 1: The first line is included in the padding.
 2: The second line is also included in the padding.
-3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
 6: The sixth line is also included in the footer padding if it consists of seven lines or less
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});

	// skip line 4 because that is not padding range.

	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 5 deleted
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 5 deleted',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..85ce6a0 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -2,6 +2,5 @@
 2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
-5: The fifth line is included in the footer padding if it consists of seven lines or less
 6: The sixth line is also included in the footer padding if it consists of seven lines or less
 7: The seventh line is included in the footer padding because it consists of seven lines or less
`;
		test('Selected 4 to 5',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 4,5 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -2,6 +2,5 @@
 2: The second line is also included in the padding.
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
-5: The fifth line is included in the footer padding if it consists of seven lines or less
 6: The sixth line is also included in the footer padding if it consists of seven lines or less
 7: The seventh line is included in the footer padding because it consists of seven lines or less
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});

	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 6 deleted
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 6 deleted',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..914d90e 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -3,5 +3,4 @@
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
-6: The sixth line is also included in the footer padding if it consists of seven lines or less
 7: The seventh line is included in the footer padding because it consists of seven lines or less
`;
		test('Selected 5 to 6',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 5,6 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -3,5 +3,4 @@
 3: The third line is also included in the padding.
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
-6: The sixth line is also included in the footer padding if it consists of seven lines or less
 7: The seventh line is included in the footer padding because it consists of seven lines or less
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});


	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 7(is last line) deleted
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 7 deleted',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..0a5e5ac 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -4,4 +4,3 @@
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
 6: The sixth line is also included in the footer padding if it consists of seven lines or less
-7: The seventh line is included in the footer padding because it consists of seven lines or less
`;
		test('Selected 6 to 7',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 6,7 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -4,4 +4,3 @@
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
 6: The sixth line is also included in the footer padding if it consists of seven lines or less
-7: The seventh line is included in the footer padding because it consists of seven lines or less
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});


	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// 'Line 7 deleted && added
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	suite('Line 7 deleted && added',()=>
	{
		const _diff = `diff --git a/in-padding-lines.md b/in-padding-lines.md
index 48ebfc1..dc663b3 100644
--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -4,4 +4,4 @@
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
 6: The sixth line is also included in the footer padding if it consists of seven lines or less
-7: The seventh line is included in the footer padding because it consists of seven lines or less
+7: 7 is lucky because it is the number 7
\\ No newline at end of file
`;
		test('Selected 6 to 7',()=>
		{
			const makePatchFromSelection = new MakePatchFromSelection({
				diff: _diff,
				selectionRange: new LineRange( 6,7 )
			});

			const patch = makePatchFromSelection.getPatchString();
			const expect = `--- a/in-padding-lines.md
+++ b/in-padding-lines.md
@@ -4,4 +4,4 @@
 4: If the document consists of 7 or more lines, the fourth line is not included in the padding.
 5: The fifth line is included in the footer padding if it consists of seven lines or less
 6: The sixth line is also included in the footer padding if it consists of seven lines or less
-7: The seventh line is included in the footer padding because it consists of seven lines or less
+7: 7 is lucky because it is the number 7
\\ No newline at end of file
`;

			assert.equal( typeof patch , 'string' , 'patch is string.');
			assert.equal( patch , expect );

		});
	});
	
});


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MakePatchFromSelection - cases that cross over chunks.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

suite('MakePatchFromSelection - cases that cross over chunks selected.', () =>
{
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// Select line 22 to 31
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	test('Select line 22 to 31',()=>
	{
		const makePatchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: new LineRange( 22,31 )
		});

		const patch = makePatchFromSelection.getPatchString();
		const expect = `--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -21,7 +21,6 @@
 - Black cats and astronomical events in Europe
 - Black cats and astronomical events in Europe
 - Feline omens in early Asian astronomy
-- Feline omens in early Asian astronomy
 
 In the medieval period, European folklore included tales of black cats appearing during strange
 astronomical events. These cats were sometimes linked to sorcery, but others believed they were
@@ -29,7 +28,7 @@ harbingers of visitors from beyond the skies. Such stories fed into an enduring
 between cats and the unknown.
 
 ## The Modern Era: UFOs and Cats
-
+ggggggg
 The modern UFO phenomenon, beginning in the 20th century, brought a new dimension to the
 alien communication or as biological recording devices.
 
`;
		assert.equal( typeof patch , 'string' , 'patch is string.');
		assert.equal( patch , expect );
	});

	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// Select line 10 to 36(Even wider range
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	test('Select line 10 to 36(Even wider range)',()=>
	{
		const makePatchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: new LineRange( 10,36 )
		});

		const patch = makePatchFromSelection.getPatchString();
		const expect = `--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -8,20 +8,17 @@
 
 ## Ancient Myths and Legends
 
-cosmic origin.
-divine mystery. Some texts even describe how Bastet was said to come from the "stars," hinting at a
-gods. The goddess Bastet, a feline deity, was revered as a protector of the home and a symbol of
-especially those with unusual features like glowing eyes, were often considered emissaries of the
 The first records of cats being associated with celestial beings date back to ancient Egypt. Cats,
+especially those with unusual features like glowing eyes, were often considered emissaries of the
+gods. The goddess Bastet, a feline deity, was revered as a protector of the home and a symbol of
+divine mystery. Some texts even describe how Bastet was said to come from the "stars," hinting at a
+cosmic origin.
 
 ### Key Myths:
 
 - Bastet as a celestial protector
-- Bastet as a celestial protector
-- Black cats and astronomical events in Europe
 - Black cats and astronomical events in Europe
 - Feline omens in early Asian astronomy
-- Feline omens in early Asian astronomy
 
 In the medieval period, European folklore included tales of black cats appearing during strange
 astronomical events. These cats were sometimes linked to sorcery, but others believed they were
@@ -29,10 +26,12 @@ harbingers of visitors from beyond the skies. Such stories fed into an enduring
 between cats and the unknown.
 
 ## The Modern Era: UFOs and Cats
-
+ggggggg
 The modern UFO phenomenon, beginning in the 20th century, brought a new dimension to the
+cat-alien narrative. Reports from abductees occasionally mentioned cats behaving oddly during
+encounters with unidentified flying objects. Some speculated that cats might act as conduits for
 alien communication or as biological recording devices.
-
+ggggg
 ### Incident in New Mexico:
 
 - Sightings of strange lights in the sky
`;
		assert.equal( typeof patch , 'string' , 'patch is string.');
		assert.equal( patch , expect );
	});


	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// Select line 24 to 34(Only the last chunk is actually used.)
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// The diff that is actually valid is only the later chunk, even 
	// though it is selected across chunks.
	test('Select line 24 to 34(Only the last chunk is actually used.)',()=>
	{
		const makePatchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: new LineRange( 24,34 )
		});

		const patch = makePatchFromSelection.getPatchString();
		const expect = `--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -29,8 +29,10 @@ harbingers of visitors from beyond the skies. Such stories fed into an enduring
 between cats and the unknown.
 
 ## The Modern Era: UFOs and Cats
-
+ggggggg
 The modern UFO phenomenon, beginning in the 20th century, brought a new dimension to the
+cat-alien narrative. Reports from abductees occasionally mentioned cats behaving oddly during
+encounters with unidentified flying objects. Some speculated that cats might act as conduits for
 alien communication or as biological recording devices.
 
 ### Incident in New Mexico:
`;
		assert.equal( typeof patch , 'string' , 'patch is string.');
		assert.equal( patch , expect );
	});


	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// Select line 20 to 28(Only the first chunk is actually used.
	// -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
	// The diff that is actually valid is only the previous chunk, even
	// though it is selected across chunks.
	test('Select line 20 to 28(Only the first chunk is actually used.)',()=>
	{
		const makePatchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: new LineRange( 20,28 )
		});

		const patch = makePatchFromSelection.getPatchString();
		const expect = `--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -17,11 +17,8 @@
 ### Key Myths:
 
 - Bastet as a celestial protector
-- Bastet as a celestial protector
-- Black cats and astronomical events in Europe
 - Black cats and astronomical events in Europe
 - Feline omens in early Asian astronomy
-- Feline omens in early Asian astronomy
 
 In the medieval period, European folklore included tales of black cats appearing during strange
 astronomical events. These cats were sometimes linked to sorcery, but others believed they were
`;
		assert.equal( typeof patch , 'string' , 'patch is string.');
		assert.equal( patch , expect );
	});
});
