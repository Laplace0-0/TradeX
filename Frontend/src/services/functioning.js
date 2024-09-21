

export const close = async(symbol, id, balance) =>{
    const response = await fetch(`https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/close`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            symbol: symbol,
            balance: balance
          }),
    });
    console.log(response.json())
}

export const buy = async(symbol, quantity, price, id, balance)=>{
        const response = await fetch(`https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/buy`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: id,
                symbol: symbol,
                quantity: quantity,
                price: price,
                balance: balance
              }),
        });
        console.log(response.json())
}

export const sell = async(symbol, quantity, price, id, balance)=>{
    const response = await fetch(`https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/sell`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            symbol: symbol,
            quantity: quantity,
            price: price,
            balance: balance
          }),
    });
    console.log(response.json())
}