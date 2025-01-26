import {Input} from "antd";
import {useEffect, useState} from "react";

const OcrInput: React.FC<{  setRefOcr: (value: string) => void }> = ({  setRefOcr }) => {
    const [ocr, setOcr] = useState("");

    useEffect(() => {
        setRefOcr(ocr);
    }, [ocr]);

   return <Input
        placeholder="OCR"
        value={ocr}
        onChange={(e) => setOcr(e.target.value)}
        style={{ flex: 1, marginRight: 8 }}
    />
};

export default OcrInput;