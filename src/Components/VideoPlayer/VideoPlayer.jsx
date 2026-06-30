import React, { useRef } from 'react'
import './VideoPlayer.css'
import DemoShowcase from '../DemoShowcase/DemoShowcase'

const VideoPlayer = ({playState, setPlayState}) => {

    const player = useRef(null);

    const closePlayer = (e) => {
      if (e.target === player.current) {
        setPlayState(false);
      }
    }

  return (
    <div className={`video-player ${playState ? '' : 'hide'}`} ref={player} onClick={closePlayer}>
      <div className="video-player-frame">
        <button className="video-player-close" onClick={() => setPlayState(false)} aria-label="Close demo">×</button>
        <DemoShowcase />
      </div>
    </div>
  )
}

export default VideoPlayer