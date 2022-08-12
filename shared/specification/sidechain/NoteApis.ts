import { z } from 'zod';
import { NoteSchema } from '../types/INote';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';

export const NoteApiSchemas = {
  'Note.get': {
    args: z.object({
      noteHash: NoteSchema.shape.noteHash,
    }),
    result: z.object({ note: NoteSchema }),
  },
  'Note.create': {
    args: z.object({
      note: NoteSchema,
    }),
    result: z.object({
      accepted: z.boolean(),
    }),
  },
};

type INoteApis = IZodSchemaToApiTypes<typeof NoteApiSchemas>;
export default INoteApis;
