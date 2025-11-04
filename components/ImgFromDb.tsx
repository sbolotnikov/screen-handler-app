import {FC, useEffect, useState} from 'react'

interface ImgFromDbProps {
  url: string,
  stylings: string,
  alt: string
}

const ImgFromDb: FC<ImgFromDbProps> = ({url,stylings, alt}) => {
    const[displayURL, setDisplayURL] =useState<string | null>(null)
    useEffect(() => {
        // GET request
        
        if ((url!.includes("http"))) setDisplayURL(url)
        else{
          fetch('/api/img_get',{
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           id:url
         })
         
             
        }).then((response) => response.json())
        .then((data) => {

            setDisplayURL(data.message)
        })
        }
      }, [url]);

return (displayURL!=null)?<img src={displayURL} className={stylings} loading="lazy" alt={alt} />:""

}
export default ImgFromDb