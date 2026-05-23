import React, { createContext, useContext, useState } from 'react';
import { LyelPayContextData, LyelPayInstance, LyelPayProviderProps } from "../types";



const LyelPayContext = createContext<LyelPayContextData | undefined>(undefined);

export const LyelPayProvider: React.FC<LyelPayProviderProps> = ({ children, lyelPayInstance }) => {
    const [lyelPay, setLyelPay] = useState<LyelPayInstance | undefined>();

    lyelPayInstance.then((instance) => {
        setLyelPay(instance);
    });

    return (
        <LyelPayContext.Provider value={{ lyelPay }}>
            {children}
        </LyelPayContext.Provider>
    );
};

export const useLyelPay = (): LyelPayContextData | undefined => {
    return useContext(LyelPayContext);
};
