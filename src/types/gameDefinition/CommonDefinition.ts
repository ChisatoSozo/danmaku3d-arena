export type Instruction = {
    at: number;
};

export type EditorInstruction = Instruction & {
    _editorTrack: number;
};
