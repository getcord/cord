import { sha256Hash } from 'common/util/index.ts';

test('test vectors', () => {
  // Test vectors from
  // https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/sha_all.pdf
  expect(sha256Hash('')).toEqual(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
  expect(sha256Hash('abc')).toEqual(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
  expect(
    sha256Hash('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
  ).toEqual('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
});
