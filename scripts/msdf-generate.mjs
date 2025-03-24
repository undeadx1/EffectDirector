import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Constants for MSDF configuration
const MSDF_CONFIG = {
  format: 'json',
  charsetFile: 'charset.txt',
  command: 'msdf-bmfont',
};

// Define a function to preprocess TTF files using FontForge
function preprocessFont(ttfFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    const command = `fontforge -lang=ff -c 'Open("${ttfFilePath}"); SelectAll(); RemoveOverlap(); Generate("${outputFilePath}")'`;

    console.log(`Executing FontForge command: ${command}`);

    const process = spawn('sh', ['-c', command]);

    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`Preprocessed font saved as: ${outputFilePath}`);
        resolve(outputFilePath);
      } else {
        reject(new Error(`FontForge process exited with code: ${code}`));
      }
    });
  });
}

// Define a function to generate MSDF fonts from TTF
function generateMSDFFont(ttfDir, outputDir) {
  if (!fs.existsSync(ttfDir)) {
    console.error('Error: TTF directory not found.');
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const charsetPath = path.resolve(scriptDir, MSDF_CONFIG.charsetFile);

  if (!fs.existsSync(charsetPath)) {
    console.error(`Error: Charset file not found at ${charsetPath}.`);
    return;
  }

  const ttfFiles = fs
    .readdirSync(ttfDir)
    .filter((file) => file.endsWith('.ttf'));

  if (ttfFiles.length === 0) {
    console.error('No TTF files found in the directory.');
    return;
  }

  ttfFiles.forEach(async (ttfFile) => {
    const ttfFilePath = path.resolve(ttfDir, ttfFile);
    const fontName = path.basename(ttfFile, path.extname(ttfFile));
    const fixedTtfPath = path.resolve(ttfDir, `fixed-${fontName}.ttf`);
    const outputJsonPath = path.resolve(outputDir, `${fontName}.json`);
    const outputAtlasPath = path.resolve(outputDir, `${fontName}.png`);
    const generatedJsonPath = path.resolve(outputDir, `fixed-${fontName}.json`);

    try {
      // Preprocess the font using FontForge
      await preprocessFont(ttfFilePath, fixedTtfPath);

      // Construct the MSDF command
      const args = [
        MSDF_CONFIG.command,
        '-f',
        MSDF_CONFIG.format,
        '-o',
        outputJsonPath,
        '-a',
        outputAtlasPath,
        '-i',
        charsetPath,
        '-m',
        '3072,3072',
        fixedTtfPath,
      ];

      console.log(`Executing command: npx ${args.join(' ')}`);

      // Execute the command
      const process = spawn('npx', args);

      process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log(`MSDF font generated for ${fontName}:`);
          console.log(`JSON: ${outputJsonPath}`);
          console.log(`Atlas: ${outputAtlasPath}`);

          // Rename the JSON file to match the original TTF name
          if (fs.existsSync(generatedJsonPath)) {
            fs.renameSync(generatedJsonPath, outputJsonPath);
            console.log(`Renamed JSON to: ${outputJsonPath}`);
          } else {
            console.error(
              `Generated JSON file not found: ${generatedJsonPath}`
            );
          }

          // Delete the fixed TTF file after processing
          fs.unlinkSync(fixedTtfPath);
          console.log(`Temporary file deleted: ${fixedTtfPath}`);
        } else {
          console.error(`Process exited with code: ${code}`);
        }
      });
    } catch (error) {
      console.error(`Error processing font ${ttfFile}: ${error.message}`);
    }
  });
}

// Example usage
const ttfDir = path.resolve('assets/fonts'); // Replace with your TTF directory
const outputDir = path.resolve('public/fonts'); // Replace with your output directory

generateMSDFFont(ttfDir, outputDir);
