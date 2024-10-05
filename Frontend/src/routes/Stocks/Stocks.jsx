import React, { useEffect, useState, useMemo } from 'react';
import './Stocks.css';
import { useCookies } from 'react-cookie';
import { getUser } from '../../services/auth';
import { getStocks } from '../../services/stocks';
import getSymbolFromCurrency from 'currency-symbol-map';
import Navbar from "../../components/navbar/Navbar";
import { Converter } from 'easy-currencies'; 
import { Link } from 'react-router-dom';

// Memoized StockRow to prevent unnecessary re-renders
const StockRow = React.memo(({ order, convertedPrice, inrSymbol, index }) => (
  <tr key={order.id}>
    <td>{index + 1}</td>
    <td><Link to={`/stocks/${order.stock_name}`} className='text-blue-500'>{order.stock_name}</Link></td>
    <td>{new Date(order.created_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}
    </td>
    <td className={order.type === "BUY" ? 'text-green-500' : 'text-orange-600'}>
      {order.type}
    </td>
    <td>{order.quantity}</td>
    <td>{inrSymbol}{order.stock_price}</td>
    <td className={`pl-column ${
      order.type === "BUY" ?
      ((convertedPrice - order.stock_price) * order.quantity).toFixed(2) >= 0 ? 'text-green-500' : 'text-orange-600'
    :
      ((convertedPrice - order.stock_price) * order.quantity).toFixed(2) < 0 ? 'text-green-500' : 'text-orange-600'
    }`}>
      {order.type === "BUY" ? ((convertedPrice - order.stock_price) * order.quantity).toFixed(2) >= 0 ? '+' : '-'
    :
      ((convertedPrice - order.stock_price) * order.quantity).toFixed(2) < 0 ? '+' : '-'}{inrSymbol}{Math.abs((convertedPrice - order.stock_price) * order.quantity).toFixed(2)} ({((Math.abs((convertedPrice - order.stock_price) * order.quantity)/Math.abs(order.stock_price * order.quantity))*100).toFixed(2)}%)
    </td>
  </tr>
));

function Stocks() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [cookies] = useCookies(['token']);
  const inrSymbol = getSymbolFromCurrency("INR");
  const [marketPrices, setMarketPrices] = useState({});
  const converter = new Converter();
  const [totalPL, setTotalPL] = useState(0); // State for storing the total P&L
  const [totalSpend, setTotalSpend] = useState(0);

  // Memoize the converted prices to avoid unnecessary recalculations
  const convertedPrices = useMemo(() => {
    const prices = {};
    let cumulativePL = 0;
    let cumulativeSpend = 0;

    orders.forEach((order, index) => {
      if (marketPrices[index]) {
        const convertedPrice = converter.convertSync(marketPrices[index].regularMarketPrice, marketPrices[index].currency, 'INR');
        prices[index] = convertedPrice;

        // Calculate P&L
        let individualPL = (convertedPrice - order.stock_price) * order.quantity;
        if (order.type === "SELL") {
          individualPL = Math.abs(individualPL);
        }

        cumulativePL += individualPL;
        cumulativeSpend += (order.stock_price * order.quantity);
      }
    });

    setTotalPL(cumulativePL);
    setTotalSpend(cumulativeSpend);
    return prices;
  }, [orders, marketPrices]);

  // Fetch market data for stocks
  useEffect(() => {
    const fetchData = async () => {
      if (orders.length === 0) return;

      try {
        // Batch request: collect all symbols at once
        const symbols = orders.map(order => order.stock_name).filter(Boolean);

        const response = await fetch(`https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/mquotes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ symbols }), // Send all symbols in one batch
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        setMarketPrices(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000); // Throttled fetch every 5 seconds
  
    return () => clearInterval(intervalId);
  }, [orders]);

  // Fetch user data
  useEffect(() => {
    if (cookies.token) {
      const fetchUser = async () => {
        try {
          const userData = await getUser(cookies.token);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      };

      fetchUser();
    }
  }, [cookies.token]);

  // Fetch user's stock orders
  useEffect(() => {
    if (user?.id) { // Ensure user is defined and has an ID
      const fetchOrders = async () => {
        try {
          const response = await getStocks(user);
          setOrders(response.length > 0 ? response : []);
        } catch (error) {
          console.error('Error fetching orders:', error); // Log any errors
        }
      };

      fetchOrders();
    }
  }, [user]);

  return (
    <>
      <Navbar />
      <br />
      <br />
      <div className="flex justify-center gap-x-24">
        <div className="stats shadow border border-white w-[400px] p-4">
          <div className="stat">
            <div className="stat-title">Wallet</div>
            <div className="stat-value">{inrSymbol}{user?.wallet}</div>
            <div className='stat-title'>Equity Investment: {inrSymbol}{totalSpend.toFixed(2)}</div>
          </div>  
        </div>
        <div className="stats shadow border border-white w-[450px] p-4">
          <div className="stat">
            <div className="stat-title">P&L</div>
            <div className={`stat-value ${totalPL >= 0 ? 'text-green-500' : 'text-orange-600'}`}>
            {totalPL >= 0 ? '+' : '-'}{inrSymbol}{Math.abs(totalPL).toFixed(2)} ({totalSpend !== 0 ? ((Math.abs(totalPL) / Math.abs(totalSpend)) * 100).toFixed(2) : '0.00'}%)
            </div>
          </div>  
        </div>
      </div>

      <br />
      <br />
      <h1 className='p-4 text-xl font-bold'>Portfolio</h1>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr> 
              <th></th>
              <th>Stock Name</th>
              <th>Bought on</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Price</th>
              <th className='pl-column'>P&L</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No Stocks found.</td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <StockRow 
                  key={order.id}
                  order={order}
                  convertedPrice={convertedPrices[index]}
                  inrSymbol={inrSymbol}
                  index={index}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Stocks;
