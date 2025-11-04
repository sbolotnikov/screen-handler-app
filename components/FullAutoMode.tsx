'use client';
import React, { useEffect, useState } from 'react';
import ManualImage from './ManualImage';

type Props = {
  seconds: number;
  text1: string;
  compLogo: string;
  videoBG: string;
  titleBarHider: boolean;
  message: string;
  fontSizeTime: number;
  showBackdrop: boolean;
  picsArray: { link: string; dances: string[] }[];
  vidsArray: { link: string; dances: string[] }[];
  onRenewInterval: () => void;
};

const FullAutoMode = ({
  picsArray,
  vidsArray,
  seconds,
  text1,
  compLogo,
  videoBG,
  showBackdrop,
  fontSizeTime,
  titleBarHider,
  onRenewInterval,
}: Props) => {
  const [activePic, setActivePic] = useState(0);
  const [activeVideo, setActiveVideo] = useState(0);
  const [usedPictures, setUsedPictures] = useState<string[]>([]);
  let timerIntervalID: any;
  let timerIntervalVideoID: any;
  const nextActive = (num: number) => {
    timerIntervalID = window.setTimeout(function () {
      window.clearTimeout(timerIntervalID);
      console.log('interval cleared in nextActive pictures', num);  
      setActivePic(getValidPictureId( picsArray.length));
      nextActive(num);
    }, num * 1000);
  };
  const nextActiveVideo = (num: number) => {
    timerIntervalVideoID = window.setTimeout(function () {
      window.clearTimeout(timerIntervalVideoID);
      console.log('interval cleared in nextActive video ',num);     
      setActiveVideo(Math.floor(Math.random()*vidsArray.length));
      nextActiveVideo(num);
    }, num * 1000);
  };
  const getValidPictureId = (base:number) => {
    let currentPictureID= Math.floor(Math.random() * base);
    let index1=0;
    while ((usedPictures.indexOf(picsArray[currentPictureID].link)!==-1)
      &&(index1>base)
    ) {
      currentPictureID= Math.floor(Math.random() * base);
      index1++;
    }
    const arrCopy=usedPictures;
      arrCopy.push(picsArray[currentPictureID].link);
      
    if (arrCopy.length>5){
      arrCopy.shift();
    }
    setUsedPictures(arrCopy)
    console.log(arrCopy)
    console.log(picsArray[currentPictureID].link)
    return currentPictureID
  }

  useEffect(() => {
    console.log(picsArray);
    let id = window.setTimeout(function () {}, 0);
    while (id--) {
      window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
    console.log('interval cleared in useEffect pictures');
    

    setActivePic(getValidPictureId(picsArray.length));
    nextActive(seconds);
    console.log(vidsArray);    
    setActiveVideo(Math.floor(Math.random()*vidsArray.length));
    nextActiveVideo(seconds*3);
    onRenewInterval();
  }, [vidsArray, picsArray]);
  return (
    <>
      {(picsArray[activePic] !== undefined) && (vidsArray[activeVideo] !== undefined)&&(
        <ManualImage
          image1={picsArray[activePic].link}
          seconds={seconds}
          text1={text1}
          compLogo={compLogo}
          fontSizeTime={fontSizeTime}
          videoBG={vidsArray[activeVideo].link}
          showBackdrop={showBackdrop}
          titleBarHider={titleBarHider}
        />
      )}
    </>
  );
};

export default FullAutoMode;

