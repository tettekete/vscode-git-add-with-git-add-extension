import * as assert from 'assert';
import parseGitDiff ,{ Chunk,ChangedFile } from 'parse-git-diff';
import { isChangedFile , isChunk } from '../lib/type-gurd/parse-git-diff';
import { ChangeSet } from '../lib/change-set';


const diff = `diff --git a/cat-and-aliens-report.md b/cat-and-aliens-report.md
index a8826c7..8743307 100644
--- a/cat-and-aliens-report.md
+++ b/cat-and-aliens-report.md
@@ -3,25 +3,24 @@
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
@@ -29,20 +28,22 @@ harbingers of visitors from beyond the skies. Such stories fed into an enduring
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

suite('ChnageSet Basic Tests', () =>
{
	test('Basic props after instanciate',()=>
	{
		const changeSet1 = new ChangeSet({ changes: chunks[0].changes });

		assert.equal( changeSet1.firstLineBefore	,3	,`changeSet1.firstLineBefore is ${changeSet1.firstLineBefore}`);
		assert.equal( changeSet1.firstLineAfter		,3	,`changeSet1.firstLineAfter is ${changeSet1.firstLineAfter}`);
		assert.equal( changeSet1.lastLineBefore		,27	,`changeSet1.lastLineBefore is ${changeSet1.lastLineBefore}`);
		assert.equal( changeSet1.lastLineAfter		,26	,`changeSet1.lastLineAfter is ${changeSet1.lastLineAfter}`);

		assert.equal( changeSet1.beforeLines		,25	,`changeSet1.beforeLines is ${changeSet1.beforeLines}`);
		assert.equal( changeSet1.afterLines			,24	,`changeSet1.afterLines is ${changeSet1.afterLines}`);
		
		const changeSet2 = new ChangeSet({ changes: chunks[1].changes });

		assert.equal( changeSet2.firstLineBefore	,29	,`changeSet2.firstLineBefore is ${changeSet2.firstLineBefore}`);
		assert.equal( changeSet2.firstLineAfter		,28	,`changeSet2.firstLineAfter is ${changeSet2.firstLineAfter}`);
		assert.equal( changeSet2.lastLineBefore		,48	,`changeSet2.lastLineBefore is ${changeSet2.lastLineBefore}`);
		assert.equal( changeSet2.lastLineAfter		,49	,`changeSet2.lastLineAfter is ${changeSet2.lastLineAfter}`);

		assert.equal( changeSet2.beforeLines		,20	,`changeSet2.beforeLines is ${changeSet2.beforeLines}`);
		assert.equal( changeSet2.afterLines			,22	,`changeSet2.afterLines is ${changeSet2.afterLines}`);


	});

	test('After Lines',() =>
	{
		[
			{
				start: 5,
				end: 9,
				lines_begin:
				[
					'For centuries,',
					'extraterrestrial',
					'connection that',
					'intriguing history',
					'fiction'
				]
			},
			{
				start: 21,
				end: 22,
				lines_begin:
				[
					'- Bastet as',
					'- Bastet as',	// DeletedLine
					'- Black cats',	// DeletedLine
					'- Black cats',
				]
			}
		].forEach((t) =>
		{
			const changeSet = new ChangeSet({ changes: chunks[0].changes });
			const extracted = changeSet.changesWithToLinesRange( t.start,t.end );

			for(let i=0;i<t.lines_begin.length;i++ )
			{
				assert.ok(
					extracted.changeAt(i).content.startsWith( t.lines_begin[i] )
					,`line [${i}] begin with ${t.lines_begin[i]}`
				);
			}
		});
		
	});

	test('Before Lines',() =>
	{
		[
			{
				start: 5,
				end: 9,
				lines_begin:
				[
					'For centuries,',
					'extraterrestrial',		// AddedLine
					'connection that',
					'intriguing history',	// AddedLine
					'fiction',
					'',
					'## Ancient'
				]
			},
			{
				start: 21,
				end: 22,
				lines_begin:
				[
					'- Black cats',	// DeletedLine
					'- Black cats',
				]
			}
		].forEach((t) =>
		{
			const changeSet = new ChangeSet({ changes: chunks[0].changes });
			const extracted = changeSet.changesWithFromLinesRange( t.start,t.end );

			for(let i=0;i<t.lines_begin.length;i++ )
			{
				assert.ok(
					extracted.changeAt(i).content.startsWith( t.lines_begin[i] )
					,`line [${i}] begin with ${t.lines_begin[i]}`
				);
			}
		});
		
	});
});