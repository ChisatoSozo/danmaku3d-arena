import { BulletPatternComponent } from "../bullets/BulletPattern";
import { useVectorMemo } from "../hooks/useVectorMemo";
import { BulletPatternAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import { IVector3 } from "../types/gameDefinition/UtilTypes";

interface SubEmitterProps {
  username: string;
  bulletPatternDefinition: BulletPatternAssetDefinition;
  position: IVector3;
}

export const SubEmitter: React.FC<SubEmitterProps> = ({
  username,
  bulletPatternDefinition,
  position,
}) => {
  const positionVector = useVectorMemo(position);

  return (
    <transformNode name="" position={positionVector}>
      <BulletPatternComponent
        username={username}
        bulletPatternDefinition={bulletPatternDefinition}
      />
    </transformNode>
  );
};
