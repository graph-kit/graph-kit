import {
  compressAnnotations,
  decompressAnnotations,
} from '@core/annotations/index';
import { assert, nullThrows } from '@core/utils/assert';
import { generateId } from '@core/utils/id';
import { DEFAULT_POSITION } from '@graph/core/positions/constants';

import { GraphEncode } from '../graph/types.ts';
import { TransitCompression } from '../product/types.ts';

const VERSION = '1';

const SECTION = '|';
const RECORD = ';';
const FIELD = ',';

/** version, camera, nodes, edges, labels, annotations */
const SECTION_COUNT = 6;

const CAMERA_PRECISION = 100;

const round = (value: number, precision = 1) =>
  Math.round(value * precision) / precision;

const toNumber = (field: string | undefined) => {
  const value = Number(field);
  assert(
    field && Number.isFinite(value),
    `graph transit: "${field}" is not a number`,
  );
  return value;
};

/**
 * leaves the last section whole, so annotations can bring their own separators through
 * rather than being escaped, which would undo most of what compressing them just saved
 */
const splitSections = (text: string) => {
  const sections: string[] = [];

  let rest = text;
  for (let index = 0; index < SECTION_COUNT - 1; index++) {
    const at = rest.indexOf(SECTION);
    assert(
      at !== -1,
      `graph transit: the payload is cut short at section ${index + 1}`,
    );
    sections.push(rest.slice(0, at));
    rest = rest.slice(at + 1);
  }

  sections.push(rest);
  return sections;
};

const records = (section: string) =>
  section ? section.split(RECORD).map((record) => record.split(FIELD)) : [];

const compress = (payload: GraphEncode) => {
  const { core, surface, nodeLabel, annotations } = payload;

  const nodeIdToOrdinal = new Map(
    core.nodes.map((node, index) => [node.id, index]),
  );
  const nodeIdToPosition = new Map(
    core.nodePositions.map(({ id, position }) => [id, position]),
  );
  const edgeIdToWeight = new Map(
    core.edgeWeights.map(({ id, weight }) => [id, weight]),
  );

  const ordinalOf = (nodeId: string) =>
    nullThrows(
      nodeIdToOrdinal.get(nodeId),
      `graph transit: "${nodeId}" is not a node in this payload`,
    );

  const camera = [surface.panX, surface.panY, surface.zoom]
    .map((value) => round(value, CAMERA_PRECISION))
    .join(FIELD);

  const nodes = core.nodes.map((node) => {
    const { x, y, z } = nodeIdToPosition.get(node.id) ?? DEFAULT_POSITION;
    const fields = [round(x), round(y)];
    if (z !== DEFAULT_POSITION.z) fields.push(z);
    return fields.join(FIELD);
  });

  const edges = core.edges.map((edge) => {
    const fields = [ordinalOf(edge.source), ordinalOf(edge.target)];
    const weight = edgeIdToWeight.get(edge.id);
    return weight === undefined
      ? fields.join(FIELD)
      : [...fields, weight].join(FIELD);
  });

  const labels = nodeLabel.flatMap(({ nodeId, label }) => {
    const ordinal = nodeIdToOrdinal.get(nodeId);
    if (ordinal === undefined) return [];
    return [[ordinal, encodeURIComponent(label)].join(FIELD)];
  });

  return [
    VERSION,
    camera,
    nodes.join(RECORD),
    edges.join(RECORD),
    labels.join(RECORD),
    compressAnnotations(annotations),
  ].join(SECTION);
};

const decompress = (text: string): GraphEncode => {
  const [version, camera, nodes, edges, labels, annotations] =
    splitSections(text);

  assert(
    version === VERSION,
    `graph transit: cannot read version "${version}"`,
  );

  const [panX, panY, zoom] = (camera ?? '').split(FIELD);

  const nodePositions = records(nodes ?? '').map(([x, y, z]) => ({
    id: generateId(),
    position: {
      x: toNumber(x),
      y: toNumber(y),
      z: z === undefined ? DEFAULT_POSITION.z : toNumber(z),
    },
  }));

  const nodeIdAt = (ordinal: string | undefined) =>
    nullThrows(
      nodePositions[toNumber(ordinal)],
      `graph transit: no node at ordinal ${ordinal}`,
    ).id;

  const edgeWeights: { id: string; weight: string }[] = [];

  const decodedEdges = records(edges ?? '').map(([source, target, weight]) => {
    const id = generateId();
    if (weight !== undefined) edgeWeights.push({ id, weight });
    return { id, source: nodeIdAt(source), target: nodeIdAt(target) };
  });

  return {
    core: {
      nodes: nodePositions.map(({ id }) => ({ id })),
      edges: decodedEdges,
      nodePositions,
      edgeWeights,
    },
    surface: {
      panX: toNumber(panX),
      panY: toNumber(panY),
      zoom: toNumber(zoom),
    },
    nodeLabel: records(labels ?? '').map(([ordinal, label]) => ({
      nodeId: nodeIdAt(ordinal),
      label: decodeURIComponent(label ?? ''),
    })),
    annotations: decompressAnnotations(annotations ?? ''),
  };
};

export const graphTransitCompression: TransitCompression = {
  compress,
  decompress,
};
