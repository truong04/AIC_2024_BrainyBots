import {Slider} from "antd";
import {useEffect, useState} from "react";


const NumberCandidatesSlider: React.FC<{ setResultSizeRef: (value: number) => void }> = ({setResultSizeRef}) => {
    const [resultSize, setResultSize] = useState(1000);
    useEffect(() => {
        setResultSizeRef(resultSize);
    }, [resultSize]);

    return <Slider
        min={100}
        max={10000}
        value={resultSize}
        onChange={(value) => setResultSize(value)}
        style={{flex: 1, marginRight: 8}}
    />
}


export default NumberCandidatesSlider;