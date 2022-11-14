import { createContext, PropsWithChildren } from "react";
import { Assets, makeDefaultAssets } from "../types/Assets";
import { useResolveFloatTextureReadPixels } from "./useResolveFloatTextureReadPixels";

interface GameContainerProps {
  assets: Assets;
}

export const AssetsContext = createContext<Assets>(makeDefaultAssets());

export const GameContainer = ({
  assets,
  children,
}: PropsWithChildren<GameContainerProps>) => {
  useResolveFloatTextureReadPixels();
  return (
    <AssetsContext.Provider value={assets}>{children}</AssetsContext.Provider>
  );
};
