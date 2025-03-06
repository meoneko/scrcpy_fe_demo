import { EventHandler } from "../services/handlerEvent";
import { ScrcpyState } from "../services/state";

type VideoComponentProps = {
  screenState: ScrcpyState | null;
};


function VideoFrame({ screenState }: VideoComponentProps) {
  if (!screenState) {
    return <> </>;
  }

  const handlerEvent = new EventHandler({ screenState });
  const { handleContextMenu, handlePointerDown, handlePointerLeave, handlePointerMove, handlePointerUp } = handlerEvent;

  const { element, width, height, rotatedWidth, rotatedHeight, rotation } = screenState;
  return (
    <div
      ref={(ref) => {
        if (ref && element && !ref.contains(element)) {
          ref.appendChild(element);
        }
      }}
      style={{
        width: width,
        height: height,
        transform: `translate(${(rotatedWidth - width) / 2
          }px, ${(rotatedHeight - height) / 2}px) rotate(${rotation * 90
          }deg)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={handleContextMenu}
    />
  );
}

export default VideoFrame;
