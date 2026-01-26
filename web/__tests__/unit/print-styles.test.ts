/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';

describe('Print Styles Configuration', () => {
  const cssPath = path.join(__dirname, '../../src/app/globals.css');
  let cssContent: string;

  beforeAll(() => {
    cssContent = fs.readFileSync(cssPath, 'utf8');
  });

  describe('Print Media Query', () => {
    it('should have @media print rules defined', () => {
      expect(cssContent).toContain('@media print');
    });

    it('should have @page rule for 4x6 paper in landscape orientation', () => {
      expect(cssContent).toContain('@page');
      // Sheet is 6" wide x 4" tall (landscape orientation for 4x6 paper)
      expect(cssContent).toContain('6in 4in');
    });
  });

  describe('Print-hide Class', () => {
    it('should define .print-hide class', () => {
      expect(cssContent).toContain('.print-hide');
    });

    it('should hide print-hide elements with display: none', () => {
      // Check that print-hide has display: none in the print media query
      const printSection = cssContent.split('@media print')[1];
      expect(printSection).toContain('print-hide');
      expect(printSection).toContain('display: none');
    });
  });

  describe('Print-sheet Class', () => {
    it('should define .print-sheet class for photo sizing', () => {
      expect(cssContent).toContain('.print-sheet');
    });

    it('should set photo dimensions to 6x4 inches (landscape)', () => {
      const printSection = cssContent.split('@media print')[1];
      // Sheet is rendered at 6" wide x 4" tall (landscape)
      expect(printSection).toContain('width: 6in');
      expect(printSection).toContain('height: 4in');
    });

    it('should remove shadows and borders from print-sheet', () => {
      const printSection = cssContent.split('@media print')[1];
      expect(printSection).toContain('box-shadow: none');
      expect(printSection).toContain('border-radius: 0');
    });
  });

  describe('Print-container Class', () => {
    it('should define .print-container class', () => {
      expect(cssContent).toContain('.print-container');
    });
  });

  describe('General Print Styles', () => {
    it('should set white background for print', () => {
      const printSection = cssContent.split('@media print')[1];
      expect(printSection).toContain('background: white');
    });

    it('should hide header during print', () => {
      const printSection = cssContent.split('@media print')[1];
      expect(printSection).toContain('header');
    });
  });
});

describe('PhotoEditor Component Print Classes', () => {
  const editorPath = path.join(
    __dirname,
    '../../src/components/photo-editor.tsx'
  );
  let editorContent: string;

  beforeAll(() => {
    editorContent = fs.readFileSync(editorPath, 'utf8');
  });

  describe('Output Section Print Classes', () => {
    it('should have print-hide on back button', () => {
      // The back button in output view should have print-hide class
      // Check that there's a button/element with both print-hide and "Back to editor"
      expect(editorContent).toContain('print-hide');
      expect(editorContent).toContain('Back to editor');
      // Verify they're on the same element (className contains print-hide, text contains Back to editor)
      expect(editorContent).toMatch(
        /className="[^"]*print-hide[^"]*"[^>]*>\s*← Back to editor/
      );
    });

    it('should have print-hide on title section', () => {
      // Title section should have print-hide
      expect(editorContent).toContain('print-hide');
      expect(editorContent).toContain('Your Passport Photos');
    });

    it('should have print-sheet on photo image', () => {
      expect(editorContent).toContain('print-sheet');
      expect(editorContent).toContain('Passport photo sheet');
    });

    it('should have print-container on image wrapper', () => {
      expect(editorContent).toContain('print-container');
    });

    it('should have print-hide on action buttons section', () => {
      // Both paid and unpaid button sections should be hidden during print
      const printHideCount = (editorContent.match(/print-hide/g) || []).length;
      expect(printHideCount).toBeGreaterThanOrEqual(3); // back button, title, buttons
    });
  });
});

describe('Header Component Print Classes', () => {
  const headerPath = path.join(__dirname, '../../src/components/header.tsx');
  let headerContent: string;

  beforeAll(() => {
    headerContent = fs.readFileSync(headerPath, 'utf8');
  });

  it('should have print-hide class on header element', () => {
    expect(headerContent).toContain('print-hide');
    expect(headerContent).toContain('<header');
  });
});
