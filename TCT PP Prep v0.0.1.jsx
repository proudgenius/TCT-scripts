// Function to delete everything above the first locked track
function deleteTracksAboveLocked(sequence) {
    if (!sequence) return;
    
    var lockedTrackIndex = -1;
    var clipsRemoved = 0;
    
    // Find the first locked video track
    for (var i = 0; i < sequence.videoTracks.numTracks; i++) {
        if (sequence.videoTracks[i].isLocked()) {
            lockedTrackIndex = i;
            break;
        }
    }
    
    // If a locked track is found, delete all clips from tracks ABOVE it (higher indices)
    if (lockedTrackIndex >= 0 && lockedTrackIndex < sequence.videoTracks.numTracks - 1) {
        for (var j = sequence.videoTracks.numTracks - 1; j > lockedTrackIndex; j--) {
            var track = sequence.videoTracks[j];
            // Remove all clips from the track
            while (track.clips.numItems > 0) {
                track.clips[0].remove(false, false);
                clipsRemoved++;
            }
        }
        return {
            success: true, 
            lockedTrack: lockedTrackIndex + 1, 
            tracksAbove: sequence.videoTracks.numTracks - lockedTrackIndex - 1,
            clipsRemoved: clipsRemoved
        };
    } else if (lockedTrackIndex >= 0) {
        return {success: false, reason: "Found locked track but it's the highest track"};
    } else {
        return {success: false, reason: "No locked video track found"};
    }
}// CollegeTourTransitionsRemover.jsx
//
// This script:
// 1. Finds sequences with "The College Tour" in the name
// 2. Duplicates them and renames the copies with " for color"
// 3. Removes all transitions from video tracks 1 and 2 in the new sequences
// 4. Deletes everything above the first locked video track
// 5. Creates an additional duplicate named "pp edl" from the "for color" sequence
// 6. Cleans up the "pp edl" sequence by keeping only Video tracks 1-2

// Function to remove transitions from specified video tracks
function removeTransitionsFromTracks(sequence, trackIndices) {
    if (!sequence) return;
    
    var transitionsRemoved = 0;
    
    for (var i = 0; i < trackIndices.length; i++) {
        var trackIndex = trackIndices[i];
        var track = sequence.videoTracks[trackIndex];
        
        if (track) {
            for (var j = track.transitions.numItems - 1; j >= 0; j--) {
                track.transitions[j].remove(false, false);
                transitionsRemoved++;
            }
        }
    }
    
    return transitionsRemoved;
}

// Function to clean up sequence, keeping only specified video tracks
function removeEverythingExceptTracks(sequence, keepTracks) {
    if (!sequence) return;
    
    var videoClipsRemoved = 0;
    var audioClipsRemoved = 0;
    
    for (var i = 0; i < sequence.videoTracks.numTracks; i++) {
        var track = sequence.videoTracks[i];
        if (!keepTracks.includes(i)) {
            // Remove all clips from the track
            while (track.clips.numItems > 0) {
                track.clips[0].remove(false, false); // Remove without ripple
                videoClipsRemoved++;
            }
        }
    }
    
    for (var j = 0; j < sequence.audioTracks.numTracks; j++) {
        var audioTrack = sequence.audioTracks[j];
        // Remove all audio clips
        while (audioTrack.clips.numItems > 0) {
            audioTrack.clips[0].remove(false, false); // Remove without ripple
            audioClipsRemoved++;
        }
    }
    
    return {
        videoClipsRemoved: videoClipsRemoved,
        audioClipsRemoved: audioClipsRemoved
    };
}

// Main function to process sequences
function processCollegeTourSequences() {
    try {
        // Check for sequences
        if (!app.project.sequences || app.project.sequences.numSequences === 0) {
            alert("No sequences found in project.");
            return;
        }
        
        // Enable QE for advanced access
        app.enableQE();
        
        // Find sequences with "The College Tour" in the name
        var searchTerm = "the college tour";
        var originalSequences = [];
        var originalCount = app.project.sequences.numSequences;
        var originalNames = {};
        
        // Collect all sequence names first
        for (var i = 0; i < originalCount; i++) {
            var seq = app.project.sequences[i];
            originalNames[seq.name] = true;
            
            // Check if it's a matching sequence
            if (seq.name.toLowerCase().indexOf(searchTerm) !== -1) {
                originalSequences.push(seq);
            }
        }
        
        // Process matching sequences
        if (originalSequences.length === 0) {
            alert("No sequences containing 'The College Tour' were found.");
            return;
        }
        
        var results = "Found " + originalSequences.length + " matching sequences.\n\n";
        var processedSequences = [];
        
        // Process each matching sequence
        for (var j = 0; j < originalSequences.length; j++) {
            var sequence = originalSequences[j];
            var origName = sequence.name;
            var targetName = origName + " for color";
            
            results += "Processing: " + origName + "\n";
            
            try {
                // Make this sequence active first
                app.project.openSequence(sequence.sequenceID);
                
                // Create the duplicate
                var clone = sequence.clone();
                if (!clone) {
                    results += "- Failed to create clone\n";
                    continue;
                }
                
                results += "- Created clone successfully\n";
                
                // Find the new sequence (it should have "Copy" in the name)
                var expectedCopyName = origName + " Copy";
                var newSequence = null;
                
                // Refresh sequence count
                var newCount = app.project.sequences.numSequences;
                
                for (var k = 0; k < newCount; k++) {
                    var candidate = app.project.sequences[k];
                    
                    // Skip sequences that existed before
                    if (originalNames[candidate.name]) {
                        continue;
                    }
                    
                    // Check if this is our copy
                    if (candidate.name === expectedCopyName || 
                        candidate.name.indexOf(origName) !== -1 && 
                        candidate.name.indexOf("Copy") !== -1) {
                        newSequence = candidate;
                        results += "- Found new sequence: " + candidate.name + "\n";
                        break;
                    }
                }
                
                if (!newSequence) {
                    results += "- Could not find the copied sequence\n";
                    continue;
                }
                
                // Rename it
                try {
                    newSequence.name = targetName;
                    
                    // Wait briefly
                    $.sleep(200);
                    
                    if (newSequence.name === targetName) {
                        results += "- Successfully renamed to: " + targetName + "\n";
                        processedSequences.push(newSequence);
                    } else {
                        results += "- Rename failed. Still named: " + newSequence.name + "\n";
                        
                        // Try QE rename as fallback
                        try {
                            app.project.activeSequence = newSequence;
                            $.sleep(200);
                            qe.project.renameSequence(newSequence.sequenceID, targetName);
                            $.sleep(200);
                            
                            if (newSequence.name === targetName) {
                                results += "- QE rename successful: " + targetName + "\n";
                                processedSequences.push(newSequence);
                            }
                        } catch (qeError) {
                            results += "- QE error: " + qeError.toString() + "\n";
                        }
                    }
                } catch (renameError) {
                    results += "- Error renaming: " + renameError.toString() + "\n";
                }
                
            } catch (seqError) {
                results += "- Error: " + seqError.toString() + "\n";
            }
        }
        
        // Now remove transitions from the newly created sequences
        results += "\nRemoving transitions from " + processedSequences.length + " sequences:\n";
        
        for (var m = 0; m < processedSequences.length; m++) {
            var colorSeq = processedSequences[m];
            results += "\nProcessing " + colorSeq.name + ":\n";
            
            try {
                // Make this sequence active
                app.project.openSequence(colorSeq.sequenceID);
                app.project.activeSequence = colorSeq;
                
                // Remove transitions from tracks 1 and 2 (indices 0 and 1)
                var transCount = removeTransitionsFromTracks(colorSeq, [0, 1]);
                results += "- Removed " + transCount + " transitions from video tracks 1 and 2\n";
                
                // Delete everything above first locked track
                var deleteResult = deleteTracksAboveLocked(colorSeq);
                if (deleteResult.success) {
                    results += "- Found locked track: Video " + deleteResult.lockedTrack + "\n";
                    results += "- Removed " + deleteResult.clipsRemoved + " clips from " + 
                               deleteResult.tracksAbove + " tracks above it\n";
                } else {
                    results += "- " + deleteResult.reason + "\n";
                }
                
                // Now create an additional "pp edl" version from the "for color" sequence
                try {
                    // Make sure the "for color" sequence is active
                    app.project.openSequence(colorSeq.sequenceID);
                    app.project.activeSequence = colorSeq;
                    
                    // Clone the "for color" sequence
                    var ppEdlClone = colorSeq.clone();
                    if (!ppEdlClone) {
                        results += "- Failed to create pp edl version\n";
                        continue;
                    }
                    
                    // Find the new clone (it should have "Copy" in the name)
                    var ppEdlSequence = null;
                    var newPpEdlName = null;
                    
                    // Get the current list of all sequences
                    var currentSequences = {};
                    for (var s = 0; s < app.project.sequences.numSequences; s++) {
                        currentSequences[app.project.sequences[s].name] = true;
                    }
                    
                    // Look for new sequence that wasn't in our previous list
                    for (var p = 0; p < app.project.sequences.numSequences; p++) {
                        var ppCandidate = app.project.sequences[p];
                        
                        // Skip if this was an existing sequence
                        if (originalNames[ppCandidate.name]) {
                            continue;
                        }
                        
                        // Check if this sequence is a copy of our "for color" sequence
                        if (ppCandidate.name === (colorSeq.name + " Copy") || 
                            (ppCandidate.name.indexOf(colorSeq.name) !== -1 && 
                             ppCandidate.name.indexOf("Copy") !== -1 &&
                             !processedSequences.includes(ppCandidate))) {
                            ppEdlSequence = ppCandidate;
                            break;
                        }
                    }
                    
                    // Create the new name by replacing "for color" with "pp edl"
                    if (ppEdlSequence) {
                        // Generate new name
                        var newPpEdlName = colorSeq.name.replace("for color", "pp edl");
                        
                        // Rename the sequence
                        ppEdlSequence.name = newPpEdlName;
                        
                        // Wait briefly
                        $.sleep(200);
                        
                        if (ppEdlSequence.name === newPpEdlName) {
                            results += "- Created and renamed copy: " + newPpEdlName + "\n";
                        } else {
                            // Try QE rename as fallback
                            try {
                                app.project.activeSequence = ppEdlSequence;
                                $.sleep(200);
                                qe.project.renameSequence(ppEdlSequence.sequenceID, newPpEdlName);
                                $.sleep(200);
                                
                                if (ppEdlSequence.name === newPpEdlName) {
                                    results += "- Created and renamed copy: " + newPpEdlName + "\n";
                                    
                                    // Clean up the pp edl sequence - keep only Video tracks 1-2 (indices 0-1)
                                    try {
                                        // Make this sequence active
                                        app.project.openSequence(ppEdlSequence.sequenceID);
                                        app.project.activeSequence = ppEdlSequence;
                                        
                                        // Clean up the sequence, keeping only Video tracks 1-2
                                        var cleanupResult = removeEverythingExceptTracks(ppEdlSequence, [0, 1]);
                                        results += "- Cleaned up pp edl sequence:\n";
                                        results += "  * Removed " + cleanupResult.videoClipsRemoved + " video clips\n";
                                        results += "  * Removed " + cleanupResult.audioClipsRemoved + " audio clips\n";
                                    } catch (cleanupErr) {
                                        results += "- Error cleaning up pp edl sequence: " + cleanupErr.toString() + "\n";
                                    }
                                } else {
                                    results += "- Created copy but failed to rename to pp edl\n";
                                }
                            } catch (renameErr) {
                                results += "- Error renaming pp edl sequence: " + renameErr.toString() + "\n";
                            }
                        }
                    } else {
                        results += "- Created clone but couldn't locate it for renaming\n";
                    }
                } catch (ppEdlError) {
                    results += "- Error creating pp edl version: " + ppEdlError.toString() + "\n";
                }
                
            } catch (transError) {
                results += "- Error removing transitions: " + transError.toString() + "\n";
            }
        }
        
        // Summary
        results += "\nSummary:\n";
        results += "- Created and renamed " + processedSequences.length + " sequences with 'for color'\n";
        results += "- Created additional 'pp edl' versions of these sequences\n";
        results += "- Removed transitions from tracks 1 and 2 in these sequences\n";
        results += "- Deleted clips from all tracks above the first locked track (where found)\n";
        results += "- Cleaned up 'pp edl' sequences by keeping only Video tracks 1-2";
        
        alert(results);
        
    } catch (error) {
        alert("Main error: " + error.toString());
    }
}

// Run the script
processCollegeTourSequences();// TargetedTrackRemoval.jsx
//
// This script specifically removes:
// - All clips from video tracks 3+ (keeping only 1-2)
// - All clips from all audio tracks
// from the active sequence

function removeSpecificTracks() {
    try {
        // Check for active sequence
        if (!app.project.activeSequence) {
            alert("No active sequence. Please open a sequence first.");
            return;
        }
        
        var sequence = app.project.activeSequence;
        var sequenceName = sequence.name;
        
        // Report the sequence we're working on
        alert("Working on sequence: " + sequenceName + "\n" +
              "Will remove all clips from:\n" +
              "- Video tracks 3 and above\n" +
              "- All audio tracks");
        
        var videoTracksTotal = sequence.videoTracks.numTracks;
        var audioTracksTotal = sequence.audioTracks.numTracks;
        var videoClipsRemoved = 0;
        var audioClipsRemoved = 0;
        
        // Process video tracks 3 and above (indices 2+)
        for (var i = 2; i < videoTracksTotal; i++) {
            try {
                var videoTrack = sequence.videoTracks[i];
                var trackClipsRemoved = 0;
                
                // Count clips before removal
                var clipCount = videoTrack.clips.numItems;
                
                // Remove all clips on this track (loop backward to avoid index issues)
                for (var c = videoTrack.clips.numItems - 1; c >= 0; c--) {
                    try {
                        videoTrack.clips[c].remove(false, false);
                        trackClipsRemoved++;
                    } catch (clipErr) {
                        // Continue if a specific clip fails
                    }
                }
                
                videoClipsRemoved += trackClipsRemoved;
            } catch (trackErr) {
                // Continue if a specific track fails
            }
        }
        
        // Process all audio tracks
        for (var j = 0; j < audioTracksTotal; j++) {
            try {
                var audioTrack = sequence.audioTracks[j];
                var audioTrackClipsRemoved = 0;
                
                // Remove all clips on this track (loop backward to avoid index issues)
                for (var a = audioTrack.clips.numItems - 1; a >= 0; a--) {
                    try {
                        audioTrack.clips[a].remove(false, false);
                        audioTrackClipsRemoved++;
                    } catch (audioClipErr) {
                        // Continue if a specific clip fails
                    }
                }
                
                audioClipsRemoved += audioTrackClipsRemoved;
            } catch (audioTrackErr) {
                // Continue if a specific track fails
            }
        }
        
        // Final report
        alert("Removed clips from sequence '" + sequenceName + "':\n" +
              "- " + videoClipsRemoved + " clips from video tracks 3+ (" + (videoTracksTotal - 2) + " tracks)\n" +
              "- " + audioClipsRemoved + " clips from all audio tracks (" + audioTracksTotal + " tracks)");
        
    } catch (error) {
        alert("Error: " + error.toString());
    }
}

// Run the script
removeSpecificTracks();