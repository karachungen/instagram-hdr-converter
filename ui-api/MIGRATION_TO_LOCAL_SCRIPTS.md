# Migration to Local Scripts

## Summary
Successfully migrated the conversion API from Docker-based execution to local script execution.

## Changes Made

### 1. API Endpoint (`server/api/convert.post.ts`)

#### Before:
- Used Docker commands to run conversion tools
- Created temporary directories in system temp folder
- Cleaned up all files after conversion

#### After:
- Uses local scripts from `server/cmd/` directory
- Saves converted files to `server/converted/` with naming pattern: `origin_{timestamp}.jpg`
- Executes `convert-to-iso-hdr.sh` script directly
- Runs `ultrahdr_app` binary directly
- Uses `exiftool` for gain map extraction
- Keeps final output files, cleans up only temporary intermediate files

### 2. File Structure

Created new directory:
```
server/
  ├── cmd/
  │   ├── convert-to-iso-hdr.sh  (existing)
  │   ├── magick                  (existing)
  │   └── ultrahdr_app            (existing)
  └── converted/                  (new)
      └── .gitignore              (ignores all except itself)
```

### 3. Key Changes in Logic

1. **Path Resolution**:
   - Uses `process.cwd()` to resolve server directory
   - All paths now relative to workspace root

2. **Output Files**:
   - Main output: `server/converted/origin_{timestamp}.jpg`
   - Input files temporarily saved as: `input_{timestamp}.avif`
   - Intermediate files: `temp_{timestamp}.raw`, `sdr_{timestamp}.raw`, etc.

3. **Script Execution**:
   ```bash
   # Before (Docker)
   docker run --rm -v "${workDir}:/data" ${dockerImage} input.avif
   
   # After (Local)
   cd "${cmdDir}" && bash "${convertScript}" -o "${outputJpgPath}" "${inputPath}"
   ```

4. **Tool Execution**:
   - Sets `PATH` environment variable to include `cmd` directory
   - Changes to `cmd` directory before executing scripts
   - Uses absolute paths for input/output files

### 4. Type Safety

Added proper TypeScript types:
- Import `H3Event` type for event parameter
- Fixed property names to match `ConversionResult` interface
- Changed `gainMapImage` to `gainMap` to match type definition

## Benefits

1. **No Docker Required**: Reduces deployment complexity
2. **Persistent Outputs**: Files saved to `server/converted/` directory
3. **Better Performance**: No container overhead
4. **Easier Debugging**: Direct access to tools and outputs
5. **Timestamped Files**: Easy to track conversion history

## Dependencies

The local environment must have:
- `exiftool` (for metadata extraction)
- `convert-to-iso-hdr.sh` script with dependencies
- `ultrahdr_app` binary compiled
- `magick` binary (ImageMagick with UHDR support)

## Output Files

After conversion, the following files are created:
- `origin_{timestamp}.jpg` - Main HDR JPEG output (kept)
- `gainmap_{timestamp}.jpg` - Extracted gain map (kept for debugging)
- `metadata_{timestamp}.cfg` - Metadata configuration (kept for debugging)
- `input_{timestamp}.avif` - Uploaded input (cleaned up)
- `temp_{timestamp}.raw`, `sdr_{timestamp}.raw` - Intermediate files (cleaned up)

