# Audio Assets

This directory contains optional audio files for the loading screen experience.

## Expected Files

- `ambient-space.mp3` - Background ambient sound for space theme
- `particle-whoosh.mp3` - Sound effect for particle explosions
- `transition.mp3` - Audio for transition from loading to galaxy

## Notes

- All audio files are **optional**
- The system gracefully degrades if audio files are missing
- Users can disable audio through preference settings
- Audio files should be optimized for web (compressed, small size)

## Recommended Specifications

- Format: MP3 or OGG
- Quality: 128kbps or lower for web optimization
- Duration: 
  - Ambient: 10-30 seconds (loopable)
  - Effects: 1-3 seconds
  - Transition: 2-5 seconds