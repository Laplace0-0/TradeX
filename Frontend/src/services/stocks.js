

export const getStocks = async(user)=>{
    const response = await fetch("https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/user-stocks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: user.id
    }),
  });
  return await response.json();
}

export const getwatchStocks = async(user)=>{
  const response = await fetch("https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/user-watchlist", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: user.id
  }),
});
return await response.json();
}

export const removestock = async(user, symbol)=>{
  const response = await fetch("https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/remove", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: user.id,
    symbol: symbol
  }),
});
return await response.json();
}

export const addstock = async(user, symbol)=>{
  const response = await fetch("https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/add", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: user.id,
    symbol: symbol
  }),
});
return await response.json();
}


export const gettransaction = async(user)=>{
  const response = await fetch("https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/transactions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: user.id
  }),
});
const result = await response.json() 
console.log(result)
return result;
}