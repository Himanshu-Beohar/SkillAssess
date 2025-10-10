const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

// Paths
const TEMPLATE_PATH = path.resolve(__dirname, '../templates/certificate_template.pdf');
const OUTPUT_DIR = path.resolve(__dirname, '../../certificates');
const ALEX_BRUSH_FONT = path.resolve(__dirname, '../assets/fonts/AlexBrush-Regular.ttf');

// Ensure output folder exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📂 Created certificates directory at: ${OUTPUT_DIR}`);
}

const certificateService = {
  async generateCertificate({ user, assessment, result, certificateUrl = null, completionDate = null }) {
    try {
      console.log('🎨 Generating certificate for:', {
        userName: user.name,
        assessmentTitle: assessment.title,
        percentage: result.percentage,
        certificateUrl,
        completionDate
      });

      if (!fs.existsSync(TEMPLATE_PATH)) {
        throw new Error(`❌ Certificate template not found at: ${TEMPLATE_PATH}`);
      }

      // ✅ STEP 1: Extract timestamp from URL or generate from completion date
      let timestamp;
      let filename;

      if (certificateUrl) {
        // Extract from existing URL: "/certificates/certificate_2_38_1760034385403.pdf"
        const urlMatch = certificateUrl.match(/certificate_(\d+)_(\d+)_(\d+)\.pdf/);
        if (urlMatch) {
          timestamp = urlMatch[3];
          filename = certificateUrl.split('/').pop();
          console.log(`📥 Extracted from URL - Timestamp: ${timestamp}, Filename: ${filename}`);
        }
      }

      // If no URL or extraction failed, generate using completion date or current time
      if (!timestamp) {
        // ✅ USE COMPLETION DATE FROM DATABASE IF PROVIDED
        if (completionDate) {
          timestamp = new Date(completionDate).getTime();
          console.log(`📅 Using completion date timestamp: ${timestamp}`);
        } else {
          timestamp = Date.now();
          console.log(`🆕 Using current timestamp: ${timestamp}`);
        }
        filename = `certificate_${user.id}_${assessment.id}_${timestamp}.pdf`;
        console.log(`📁 Generated filename: ${filename}`);
      }

      const filePath = path.join(OUTPUT_DIR, filename);

      // ✅ STEP 2: Check if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`✅ Certificate file already exists: ${filename}`);
        console.log(`📊 File stats: ${fs.statSync(filePath).size} bytes`);
        
        // Return the existing file URL
        return `/certificates/${filename}`;
      }

      console.log(`🔍 Certificate file not found, generating new: ${filename}`);

      // ✅ STEP 3: Generate new certificate
      const templateBytes = fs.readFileSync(TEMPLATE_PATH);
      const pdfDoc = await PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);

      const page = pdfDoc.getPages()[0];
      const { width } = page.getSize();

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let alexBrushFont = fontBold;
      if (fs.existsSync(ALEX_BRUSH_FONT)) {
        const alexFontBytes = fs.readFileSync(ALEX_BRUSH_FONT);
        alexBrushFont = await pdfDoc.embedFont(alexFontBytes);
        console.log('✅ Alex Brush font loaded successfully');
      } else {
        console.warn('⚠️ Alex Brush font not found, using Helvetica instead.');
      }

      const textColor = rgb(0.1, 0.1, 0.1);

      // ✅ USE COMPLETION DATE FOR CERTIFICATE DATE
      const completionDateObj = completionDate ? new Date(completionDate) : new Date();
      
      // Certificate Data
      const data = {
        studentName: user.name || 'Student Name',
        assessmentTitle: assessment.title || 'Assessment Title',
        score: `${result.percentage}%`,
        // ✅ Use the actual completion date from database
        date: completionDateObj.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        serial: `CERT-${user.id}-${assessment.id}-${timestamp}`,
      };

      console.log(`📝 Serial Number: ${data.serial}`);
      console.log(`📁 Filename: ${filename}`);
      console.log(`📅 Certificate Date: ${data.date}`);
      console.log(`✅ MATCHING: ${data.serial.includes(timestamp) ? 'YES' : 'NO'}`);

      // Helper: Draw centered text
      const centerText = (text, y, size, font = fontRegular, color = textColor) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        const x = (width - textWidth) / 2;
        page.drawText(text, { x, y, size, font, color });
      };

      // Your existing placement code
      centerText(data.studentName, 340, 40, alexBrushFont, rgb(0.2, 0.15, 0.1));
      centerText(data.assessmentTitle, 270, 18, fontBold);
      
      page.drawText(`With a Score of: ${data.score}`, {
        x: 315,
        y: 235,
        size: 12,
        font: fontBold,
        color: textColor,
      });

      page.drawText(`Date: ${data.date}`, {
        x: 455,
        y: 235,
        size: 12,
        font: fontRegular,
        color: textColor,
      });

      centerText(data.serial, 50, 10, fontRegular);

      // ✅ STEP 4: Save the new certificate
      fs.writeFileSync(filePath, await pdfDoc.save());

      // Verify the file was created
      if (!fs.existsSync(filePath)) {
        throw new Error('❌ Certificate file was not created');
      }

      const stats = fs.statSync(filePath);
      console.log(`✅ New certificate generated: ${filePath} (${stats.size} bytes)`);

      return `/certificates/${filename}`;

    } catch (error) {
      console.error('❌ Certificate generation failed:', error);
      throw error;
    }
  },

  // ✅ STEP 5: Add helper method to check certificate existence
  async checkCertificateExists(certificateUrl) {
    if (!certificateUrl) return false;
    
    try {
      const filename = certificateUrl.split('/').pop();
      const filePath = path.join(OUTPUT_DIR, filename);
      
      const exists = fs.existsSync(filePath);
      console.log(`🔍 Certificate check: ${filename} - ${exists ? 'EXISTS' : 'MISSING'}`);
      
      return exists;
    } catch (error) {
      console.error('❌ Error checking certificate existence:', error);
      return false;
    }
  },

  // ✅ STEP 6: Add method to regenerate if missing (updated with completionDate)
  async ensureCertificateExists({ user, assessment, result, certificateUrl, completionDate = null }) {
    if (!certificateUrl) {
      console.log('🔍 No certificate URL provided, generating new certificate');
      return await this.generateCertificate({ user, assessment, result, completionDate });
    }

    const exists = await this.checkCertificateExists(certificateUrl);
    
    if (exists) {
      console.log('✅ Certificate exists, returning existing URL');
      return certificateUrl;
    } else {
      console.log('🔍 Certificate missing, regenerating...');
      return await this.generateCertificate({ 
        user, 
        assessment, 
        result, 
        certificateUrl,
        completionDate 
      });
    }
  }
};

module.exports = certificateService;