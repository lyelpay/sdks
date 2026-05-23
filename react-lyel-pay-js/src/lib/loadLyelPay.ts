export const loadLyelPay = (apiKey: string, amount: number, clientSecret: string) => {
    return new Promise((resolve) => {
        const lyelPayInstance = {
            apiKey,
            initializationDate: new Date(),
            amount,
            clientSecret
        };
        resolve(lyelPayInstance);
    });
};
