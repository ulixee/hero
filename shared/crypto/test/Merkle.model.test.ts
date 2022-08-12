import { createHash } from 'crypto';
import { MerklePosition } from '@ulixee/specification/types/IMerkleProof';
import MerkleTree from '../lib/MerkleTree';

function sha256(data: string): Buffer {
  return createHash('sha256').update(Buffer.from(data, 'hex')).digest();
}

function sha3(data: string | Buffer): Buffer {
  return createHash('sha3-256').update(data).digest();
}

test('sha256 nodes with sha3 leaves', () => {
  const leaves = ['a', 'b', 'c'].map(sha3);

  const tree = new MerkleTree(leaves, sha256);

  const root = '49d2d1a14929a8f556bd6f4a698d90a48c9d1ca5a562773010dfdc93f8340ab9';
  expect(tree.getRoot().toString('hex')).toBe(root);
});

test('sha3', () => {
  expect.assertions(20);

  const leaves = ['a', 'b', 'c'].map(sha3);

  const aHash = Buffer.from(
    '80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b',
    'hex',
  );
  const bHash = Buffer.from(
    'b039179a8a4ce2c252aa6f2f25798251c19b75fc1508d9d511a191e0487d64a7',
    'hex',
  );
  const cHash = Buffer.from(
    '263ab762270d3b73d3e2cddf9acc893bb6bd41110347e5d5e4bd1d3c128ea90a',
    'hex',
  );

  expect(leaves).toEqual([aHash, bHash, cHash]);

  const tree = new MerkleTree(leaves, sha3);

  const layers = tree.layers.slice(1); // no leaves

  const layer1 = sha3(Buffer.concat([leaves[0], leaves[1]]));
  expect(layers[0].nodes[0]).toEqual(layer1);
  expect(layers[0].nodes[1]).toEqual(cHash);

  const root = Buffer.from(
    'b940dc53d707e4d9dfe9300664c6bbc4ab0c9f045d74441bfeda030cedbdbcba',
    'hex',
  );
  expect(tree.getRoot().toString('hex')).toEqual(root.toString('hex'));

  const proof0 = tree.getProof(leaves[0]);
  expect(proof0.length).toBe(2);
  expect(proof0[0].position).toBe(MerklePosition.Right);
  expect(proof0[0].hash).toEqual(bHash);
  expect(proof0[1].position).toBe(MerklePosition.Right);
  expect(proof0[1].hash).toEqual(cHash);

  expect(MerkleTree.verify(proof0, leaves[0], root, sha3)).toBe(true);

  const proof1 = tree.getProof(leaves[1]);
  expect(proof1.length).toBe(2);
  expect(proof1[0].position).toBe(MerklePosition.Left);
  expect(proof1[0].hash).toEqual(aHash);
  expect(proof1[1].position).toBe(MerklePosition.Right);
  expect(proof1[1].hash).toEqual(cHash);

  expect(MerkleTree.verify(proof1, leaves[1], root, sha3)).toBe(true);

  const proof2 = tree.getProof(leaves[2]);
  expect(proof2.length).toBe(1);
  expect(proof2[0].position).toBe(MerklePosition.Left);
  expect(proof2[0].hash).toEqual(layer1);

  expect(MerkleTree.verify(proof2, leaves[2], root, sha3)).toBe(true);
});

test('sha3 [keccak-256] with duplicate leaves', () => {
  const leaves = ['a', 'b', 'a'].map(sha3);

  const aHash = '80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b';
  const bHash = 'b039179a8a4ce2c252aa6f2f25798251c19b75fc1508d9d511a191e0487d64a7';

  const tree = new MerkleTree(leaves, sha3);

  expect(leaves.map(x => x.toString('hex'))).toEqual([aHash, bHash, aHash]);

  expect(tree.getRoot().toString('hex')).toEqual('e0c866810cf325979eca6987adb9bc627720a3b9502d620b1d6608ee765f07dd');

  const layer1 = sha3(Buffer.concat([leaves[0], leaves[1]]));

  const proof0 = tree.getProof(leaves[2], 2);
  expect(proof0.length).toBe(1);
  expect(proof0[0].position).toBe(MerklePosition.Left);
  expect(proof0[0].hash).toEqual(layer1);
});

test('sha256 - no leaves', () => {
  const leaves = [];
  const tree = new MerkleTree(leaves, sha256);

  const root = '';
  expect(tree.getRoot().toString('hex')).toBe(root);
});

test('should be able to find indices by proof (balanced trees only)', () => {
  const leaves2x = ['a', 'b', 'c', 'd'].map(sha3);
  const tree2x = new MerkleTree(leaves2x, sha256);
  {
    // proof 0
    const proof = tree2x.getProofForIndex(0);
    expect(proof).toHaveLength(2);
    expect(proof[0].position).toBe(MerklePosition.Right);
    expect(proof[1].position).toBe(MerklePosition.Right);
    expect(MerkleTree.getLeafIndex(proof)).toBe(0);
  }
  {
    // proof 1
    const proof = tree2x.getProofForIndex(1);
    expect(proof).toHaveLength(2);
    expect(proof[0].position).toBe(MerklePosition.Left); // 1
    expect(proof[1].position).toBe(MerklePosition.Right); // 0
    expect(MerkleTree.getLeafIndex(proof)).toBe(1);
  }
  {
    // proof 2
    const proof = tree2x.getProofForIndex(2);
    expect(proof).toHaveLength(2);
    expect(proof[0].position).toBe(MerklePosition.Right); // 0
    expect(proof[1].position).toBe(MerklePosition.Left); // 2
    expect(MerkleTree.getLeafIndex(proof)).toBe(2);
  }
  {
    // proof 3
    const proof = tree2x.getProofForIndex(3);
    expect(proof).toHaveLength(2);
    expect(proof[0].position).toBe(MerklePosition.Left); // 1
    expect(proof[1].position).toBe(MerklePosition.Left); // 2
    expect(MerkleTree.getLeafIndex(proof)).toBe(3);
  }

  const leaves = ['a', 'b', 'c', 'd', '0', '0', '1', '2'].map(sha3);
  const tree = new MerkleTree(leaves, sha256);
  {
    // proof 0
    const proof = tree.getProofForIndex(0);
    expect(proof).toHaveLength(3);
    expect(proof[0].position).toBe(MerklePosition.Right);
    expect(proof[1].position).toBe(MerklePosition.Right);
    expect(proof[2].position).toBe(MerklePosition.Right);
    expect(MerkleTree.getLeafIndex(proof)).toBe(0);
  }
  {
    // proof 1
    const proof = tree.getProofForIndex(1);
    expect(proof).toHaveLength(3);
    expect(proof[0].position).toBe(MerklePosition.Left); // 1
    expect(proof[1].position).toBe(MerklePosition.Right); // 0
    expect(proof[2].position).toBe(MerklePosition.Right); // 0
    expect(MerkleTree.getLeafIndex(proof)).toBe(1);
  }
  {
    // proof 2
    const proof = tree.getProofForIndex(2);
    expect(proof).toHaveLength(3);
    expect(proof[0].position).toBe(MerklePosition.Right); // 0
    expect(proof[1].position).toBe(MerklePosition.Left); // 2
    expect(proof[2].position).toBe(MerklePosition.Right); // 0
    expect(MerkleTree.getLeafIndex(proof)).toBe(2);
  }
  {
    // proof 3
    const proof = tree.getProofForIndex(3);
    expect(proof).toHaveLength(3);
    expect(proof[0].position).toBe(MerklePosition.Left); // 1
    expect(proof[1].position).toBe(MerklePosition.Left); // 2
    expect(proof[2].position).toBe(MerklePosition.Right); // 0
    expect(MerkleTree.getLeafIndex(proof)).toBe(3);
  }
  {
    // proof 4
    const proof = tree.getProofForIndex(4);
    expect(proof).toHaveLength(3);
    expect(proof[0].position).toBe(MerklePosition.Right); // 0
    expect(proof[1].position).toBe(MerklePosition.Right); // 0
    expect(proof[2].position).toBe(MerklePosition.Left); // 4
    expect(MerkleTree.getLeafIndex(proof)).toBe(4);
  }
  {
    // proof 5
    const proof = tree.getProofForIndex(5);
    expect(proof).toHaveLength(3);
    expect(proof[0].position).toBe(MerklePosition.Left); // 1
    expect(proof[1].position).toBe(MerklePosition.Right); // 0
    expect(proof[2].position).toBe(MerklePosition.Left); // 4
    expect(MerkleTree.getLeafIndex(proof)).toBe(5);
  }
  {
    // proof 6
    const proof = tree.getProofForIndex(6);
    expect(proof).toHaveLength(3);
    expect(proof[0].position).toBe(MerklePosition.Right); // 0
    expect(proof[1].position).toBe(MerklePosition.Left); // 2
    expect(proof[2].position).toBe(MerklePosition.Left); // 4
    expect(MerkleTree.getLeafIndex(proof)).toBe(6);
  }
  {
    // proof 7
    const proof = tree.getProofForIndex(7);
    expect(proof).toHaveLength(3);
    expect(proof[0].position).toBe(MerklePosition.Left);
    expect(proof[1].position).toBe(MerklePosition.Left);
    expect(proof[2].position).toBe(MerklePosition.Left);
    expect(MerkleTree.getLeafIndex(proof)).toBe(7);
  }
});

test('sha3 - 100,000 leaves', () => {
  const values = [];
  for (let i = 0; i < 1e5; i += 1) {
    values.push(`${i}`);
  }

  const leaves = values.map(x => sha3(x));

  const tree = new MerkleTree(leaves, sha3);

  const root = '9ae5005173e8c0f54cebb774855398cc1613c5b8237e42b944b2c6a8f4483efc';
  expect(tree.getRoot().toString('hex')).toBe(root);
});
