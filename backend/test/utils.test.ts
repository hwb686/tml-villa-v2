const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock environment
process.env.JWT_SECRET = 'test-secret-key-for-unit-testing';

// Test helpers (copied from db.js for isolated testing)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
const JWT_EXPIRES_IN = '24h';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const checkPassword = async (plain, stored) => {
  if (stored && stored.startsWith('$2')) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
};

const hashPassword = async (plain) => {
  return bcrypt.hash(plain, 10);
};

const highlightKeyword = (text, keyword) => {
  if (!keyword || !text) return { text, highlighted: text };
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const highlighted = text.replace(regex, '<<HIGHLIGHT>>$1<<END>>');
  return { text, highlighted };
};

describe('Auth Utilities', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { id: 1, username: 'testuser', role: 'user' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include payload data in token', () => {
      const payload = { id: 1, username: 'testuser', role: 'admin' };
      const token = generateToken(payload);
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe('testuser');
      expect(decoded.role).toBe('admin');
    });

    it('should set expiration time', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'mysecretpassword';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash starts with $2
    });

    it('should generate different hashes for same password', async () => {
      const password = 'mysecretpassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Different salt
    });
  });

  describe('checkPassword', () => {
    it('should verify correct password against bcrypt hash', async () => {
      const password = 'mysecretpassword';
      const hash = await hashPassword(password);
      
      const result = await checkPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should reject wrong password against bcrypt hash', async () => {
      const password = 'mysecretpassword';
      const hash = await hashPassword(password);
      
      const result = await checkPassword('wrongpassword', hash);
      expect(result).toBe(false);
    });

    it('should compare plain text passwords (migration compatibility)', async () => {
      const result = await checkPassword('password123', 'password123');
      expect(result).toBe(true);
    });

    it('should reject wrong plain text passwords', async () => {
      const result = await checkPassword('password123', 'differentpassword');
      expect(result).toBe(false);
    });

    it('should handle null stored password', async () => {
      const result = await checkPassword('password123', null);
      expect(result).toBe(false);
    });

    it('should handle undefined stored password', async () => {
      const result = await checkPassword('password123', undefined);
      expect(result).toBe(false);
    });
  });
});

describe('Highlight Utility', () => {
  describe('highlightKeyword', () => {
    it('should highlight matching keyword', () => {
      const result = highlightKeyword('Beautiful villa in Bangkok', 'villa');
      expect(result.highlighted).toBe('Beautiful <<HIGHLIGHT>>villa<<END>> in Bangkok');
    });

    it('should be case insensitive', () => {
      const result = highlightKeyword('VILLA in Bangkok', 'villa');
      expect(result.highlighted).toBe('<<HIGHLIGHT>>VILLA<<END>> in Bangkok');
    });

    it('should handle multiple occurrences', () => {
      const result = highlightKeyword('villa villa villa', 'villa');
      expect(result.highlighted).toBe('<<HIGHLIGHT>>villa<<END>> <<HIGHLIGHT>>villa<<END>> <<HIGHLIGHT>>villa<<END>>');
    });

    it('should return original text if no keyword', () => {
      const result = highlightKeyword('Beautiful villa', '');
      expect(result.highlighted).toBe('Beautiful villa');
    });

    it('should return original text if keyword is null', () => {
      const result = highlightKeyword('Beautiful villa', null);
      expect(result.highlighted).toBe('Beautiful villa');
    });

    it('should return original text if text is null', () => {
      const result = highlightKeyword(null, 'villa');
      expect(result.highlighted).toBe(null);
    });

    it('should escape special regex characters', () => {
      const result = highlightKeyword('Price: $100', '$100');
      expect(result.highlighted).toBe('Price: <<HIGHLIGHT>>$100<<END>>');
    });

    it('should handle special regex characters in keyword', () => {
      const result = highlightKeyword('Find (villa) here', '(villa)');
      expect(result.highlighted).toBe('Find <<HIGHLIGHT>>(villa)<<END>> here');
    });
  });
});
