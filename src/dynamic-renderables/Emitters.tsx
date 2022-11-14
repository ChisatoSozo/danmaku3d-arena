import { Emitter } from "../bullets/Emitter";
import { definition } from "../gameDefinition/definition";

interface EmittersProps {
  username: string;
}

export const Emitters = ({ username }: EmittersProps) => {
  return (
    <>
      {definition.playableCharacters[0].emitters.map((emitterDefinition, i) => {
        return (
          <Emitter
            username={username}
            key={i}
            focused={false}
            emitterDefinition={emitterDefinition}
          />
        );
      })}
    </>
  );
};
