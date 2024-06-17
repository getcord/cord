import { Buffer } from 'buffer';
import isValidDataURL from 'valid-data-url';

export const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_PROFILE_PICTURE_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
export const RESIZE_PROFILE_PICTURE_THRESHOLD = 0.1 * 1024 * 1024; // 0.1 MB
const MAX_APPLICATION_ASSET_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

export const MIN_RESIZED_PROFILE_PICTURE_DIMENSION = 512;

const ALLOWED_APPLICATION_ASSET_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
];

const ALLOWED_PROFILE_PICTURE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// This was based on
// * https://slack.com/intl/en-gb/help/articles/1500002249342-Restricted-file-types-in-Slack-Connect
// * https://support.google.com/mail/answer/6590?hl=en-GB#zippy=%2Cmessages-that-have-attachments
// * https://support.microsoft.com/en-us/office/blocked-attachments-in-outlook-434752e1-02d3-4e90-9124-8b81e49a8519
const BANNED_FILE_EXTENSIONS = [
  '.7z', // 7-ZIP
  '.ade', // Microsoft Access project extension
  '.adp', // Microsoft Access project
  '.apk', // Android application
  '.app', // Windows application
  '.application', // ClickOnce deployment manifest file
  '.appref-ms', // ClickOnce application reference file
  '.appx', // Windows application
  '.appxbundle', // Windows application
  '.asp', // ASP file
  '.aspx', // ASP file
  '.asx', // ASF redirector file
  '.bas', // BASIC source code
  '.bat', // Windows batch file
  '.bgi', // Borland graphics interface
  '.cab', // Windows cabinet file
  '.cer', // Certificate file
  '.chm', // Windows help module
  '.cmd', // Windows command script
  '.cnt', // Microsoft help workshop application
  '.com', // Windows command script
  '.cpl', // Windows control panel
  '.crt', // Certificate file
  '.csh', // csh script
  '.der', // X509 certificate file
  '.diagcab', // Windows troubleshooting cabinet file
  '.diagcfg', // Windows troubleshooting config file
  '.dll', // Windows dynamically linked library
  '.dmg', // MacOS disk image
  '.exe', // Windows executable
  '.fxp', // Microsoft FoxPro compiled source
  '.gadget', // Windows Vista gadget
  '.grp', // Microsoft program group
  '.gz', // GZip file
  '.hlp', // Windows help file
  '.hpj', // AppWizard Help project
  '.hta', // HTML application file
  '.htc', // HTML component file
  '.img', // Disk image
  '.inf', // Information or setup file
  '.ins', // Windows internet settings file
  '.ipa', // iOS application
  '.iso', // Disk image
  '.isp', // IIS internet settings file
  '.its', // Internet document set
  '.jar', // Java binary code
  '.jnlp', // Java Web Start file
  '.js', // JavaScript source file
  '.jse', // JScript encoded file
  '.jsp', // Jakarta server pages source file
  '.ksh', // ksh shell script
  '.lib', // Generic library file
  '.lnk', // Windows shortcut
  '.mad', // Microsoft Access module shortcut
  '.maf', // Microsoft Access file
  '.mag', // Microsoft Access diagram shortcut
  '.mam', // Microsoft Access macro shortcut
  '.maq', // Microsoft Access query shortcut
  '.mar', // Microsoft Access report shortcut
  '.mas', // Microsoft Access stored procedures
  '.mat', // Microsoft Access table shortcut
  '.mau', // Media attachment unit
  '.mav', // Microsoft Access view shortcut
  '.maw', // Microsoft Access data access page
  '.mcf', // Media container format
  '.mda', // Microsoft Access add-in
  '.mdb', // Microsoft Access application
  '.mde', // Microsoft Access add-in
  '.mdt', // Microsoft Access add-in data
  '.mdw', // Microsoft Access workgroup information
  '.mdz', // Microsoft Access wizard template
  '.msc', // Microsoft management console snap-in
  '.msh', // Microsoft shell
  '.msh1', // Microsoft shell
  '.msh1xml', // Microsoft shell
  '.msh2', // Microsoft shell
  '.msh2xml', // Microsoft shell
  '.mshxml', // Microsoft shell
  '.msi', // Windows installer
  '.msix', // Windows installer
  '.msixbundle', // Windows installer
  '.msp', // Windows OS patch file
  '.mst', // Windows installer settings file
  '.msu', // Windows update file
  '.nsh', // Nullsoft installer file
  '.ops', // Office profile settings file
  '.osd', // Open software description
  '.pcd', // Microsoft visual test
  '.pif', // Windows shortcut
  '.pl', // Perl script
  '.plg', // Developer Studio build log
  '.prf', // Windows system file
  '.prg', // Windows program file
  '.printerexport', // Printer backup File
  '.ps1', // Windows PowerShell script
  '.ps1xml', // Windows PowerShell script
  '.ps2', // Windows PowerShell script
  '.ps2xml', // Windows PowerShell script
  '.psc1', // Windows PowerShell script
  '.psc2', // Windows PowerShell script
  '.psd1', // Windows PowerShell script
  '.psdm1', // Windows PowerShell script
  '.pst', // MS Exchange address book file
  '.py', // Python script
  '.pyc', // Python script
  '.pyo', // Python script
  '.pyw', // Python script
  '.pyz', // Python script
  '.pyzw', // Python script
  '.reg', // Windows Registry file
  '.scf', // Windows Explorer command
  '.scr', // Windows screensaver
  '.sct', // Windows scriptlet
  '.shb', // Windows shortcut
  '.shs', // Shell scrap object
  '.sys', // Windows system settings
  '.tar', // TAR archive file
  '.theme', // Windows desktop theme
  '.tmp', // Temporary file
  '.url', // URL file
  '.vb', // Visual Basic source file
  '.vbe', // Visual Basic executable
  '.vbp', // Visual Basic project file
  '.vbs', // Visual Basic script file
  '.vhd', // Windows Virtual PC hard disk image
  '.vhdx', // Windows Virtual PC hard disk image
  '.vsmacros', // Visual Studio macros
  '.vsw', // Microsoft Visio workspace file
  '.vxd', // Windows virtual device driver
  '.webpnp', // Internet printing file
  '.website', // IE pinned site shortcut
  '.ws', // Windows script file
  '.wsc', // Windows scripting component
  '.wsf', // Windows script file
  '.wsh', // Windows script settings file
  '.xbap', // Browser applications
  '.xll', // Excel plugin
  '.xnk', // Exchange public folder shortcut
];

const BANNED_MIME_TYPES = [
  'application/x-msdownload', // Windows executable
  'application/x-ms-installer', // Windows installer
];

// Currently, only icons and images are uploaded from the dev portal.
// Extend allowed types when new use cases arise.
const ALLOWED_APPLICATION_ASSET_NAMES = [
  'icon',
  'email-logo',
  'nux-initial-open-image',
  'nux-welcome-image',
  'support-avatar',
] as const;

export type ApplicationAssetNameType =
  (typeof ALLOWED_APPLICATION_ASSET_NAMES)[number];

type FileUsage = 'attachment' | 'profile_picture' | 'application_asset';

type UploadValidator = {
  nameValidator: (name: string) => boolean;
  mimeTypeValidator: (mimeType: string) => boolean;
  maxSize: number;
};

const UPLOAD_VALIDATORS: Record<FileUsage, UploadValidator> = {
  application_asset: {
    nameValidator: (name: string) =>
      ALLOWED_APPLICATION_ASSET_NAMES.includes(
        name as ApplicationAssetNameType,
      ),
    mimeTypeValidator: (mimeType: string) =>
      ALLOWED_APPLICATION_ASSET_MIME_TYPES.includes(mimeType),
    maxSize: MAX_APPLICATION_ASSET_UPLOAD_SIZE,
  },
  profile_picture: {
    nameValidator: (name: string) => {
      const lowerName = name.toLowerCase();
      return BANNED_FILE_EXTENSIONS.every((ext) => !lowerName.endsWith(ext));
    },
    mimeTypeValidator: (mimeType: string) =>
      ALLOWED_PROFILE_PICTURE_MIME_TYPES.includes(mimeType),
    maxSize: MAX_PROFILE_PICTURE_UPLOAD_SIZE,
  },
  attachment: {
    nameValidator: (name: string) => {
      const lowerName = name.toLowerCase();
      return BANNED_FILE_EXTENSIONS.every((ext) => !lowerName.endsWith(ext));
    },
    mimeTypeValidator: (mimeType: string) =>
      !BANNED_MIME_TYPES.includes(mimeType),
    maxSize: MAX_UPLOAD_SIZE,
  },
};

type FileLike = {
  name: string;
  mimeType: string;
  size: number;
};

export type ValidationResult = {
  readonly input: FileLike;
  readonly name: boolean;
  readonly mimeType: boolean;
  readonly size: boolean;
  readonly valid: boolean;
};

export function validateFileForUpload(
  kind: FileUsage,
  input: FileLike,
): ValidationResult {
  const { name, mimeType, size } = input;
  const validator = UPLOAD_VALIDATORS[kind];
  if (!validator) {
    throw new Error(`Could not find validator for type ${kind}`);
  }
  return {
    input,
    name: validator.nameValidator(name),
    mimeType: validator.mimeTypeValidator(mimeType),
    size: size < validator.maxSize,
    get valid() {
      return this.name && this.mimeType && this.size;
    },
  };
}

export function assertValid(result: ValidationResult) {
  // This should match the logic in
  // server/src/public/routes/platform/files/util.ts, but it throws normal
  // Errors
  if (!result.name) {
    throw new Error(`Cannot upload file named ${result.input.name}`);
  }
  if (!result.size) {
    throw new Error(`Maximum file size exceeded`);
  }
  if (!result.mimeType) {
    throw new Error(`Input ${result.input.mimeType} MIME type is not allowed`);
  }
}

const BASE64_SEPARATOR = ';base64,';

export function assertValidUploadDataURL(name: string, dataURL: string) {
  // check string is valid data URL
  const isValid = isValidDataURL(dataURL);
  if (!isValid) {
    throw new Error('Input is not valid dataURL');
  }

  // check if mime type is allowed
  const separatorIndex = dataURL.indexOf(BASE64_SEPARATOR);
  const mimeType = dataURL.substring(5, separatorIndex);
  const buffer = bufferFromDataURL(dataURL);
  assertValid(
    validateFileForUpload('attachment', {
      name,
      mimeType,
      size: buffer.length,
    }),
  );

  return { mimeType, buffer };
}

export function bufferFromDataURL(dataURL: string) {
  const separatorIndex = dataURL.indexOf(BASE64_SEPARATOR);
  return Buffer.from(
    dataURL.substring(separatorIndex + BASE64_SEPARATOR.length),
    'base64',
  );
}

export const readFileAsync = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
