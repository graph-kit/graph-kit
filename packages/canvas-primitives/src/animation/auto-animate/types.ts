import { ShapeName } from '../../types/index.ts';
import { LooseSchema } from '../types.ts';

export type LooseSchemaWithName = LooseSchema & { shapeName: ShapeName };
