import { useEffect, useState } from 'react';
import './Stocks.css';
import { useCookies } from 'react-cookie';
import { getUser } from '../../services/auth';
import { getStocks } from '../../services/stocks';
import getSymbolFromCurrency from 'currency-symbol-map';
import Navbar from "../../components/navbar/Navbar";
import { Converter } from 'easy-currencies'; 
import { Link } from 'react-router-dom';

function Stocks() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [cookies] = useCookies(['token']);
  const inrSymbol = getSymbolFromCurrency("INR");
  const [marketPrices, setMarketPrices] = useState([]);
  const converter = new Converter();
  const [convertedPrices, setConvertedPrices] = useState({});
  const [totalPL, setTotalPL] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);

  // Fetch market prices and convert them to INR
  useEffect(() => {
    const convertPrices = async () => {
      let cumulativePL = 0;
      let cumulativeS = 0;
      const newConvertedPrices = {};

      await Promise.all(marketPrices.map(async (priceData, index) => {
        if (priceData) {
          const priceInUSD = priceData.regularMarketPrice;
          try {
            const convertedPrice = await converter.convert(priceInUSD, priceData.currency, 'INR');
            newConvertedPrices[index] = convertedPrice;

            const order = orders[index];
            let individualPL = (convertedPrice - order.stock_price) * order.quantity;
            if (order.type === "SELL") individualPL = Math.abs(individualPL);
            
            cumulativePL += individualPL;
            cumulativeS += (order.stock_price * order.quantity);
          } catch (error) {
            console.error(`Error converting price for index ${index}:`, error);
            newConvertedPrices[index] = null;
          }
        }
      }));

      setConvertedPrices(newConvertedPrices);
      setTotalPL(cumulativePL);
      setTotalSpend(cumulativeS);
    };

    convertPrices();
  }, [marketPrices, orders]);

  // Fetch market data for stocks
  useEffect(() => {
    const fetchData = async () => {
      if (orders.length === 0) return;

      try {
        const symbolsObj = Object.fromEntries(orders.map(order => [order.stock_name, true]));
        const response = await fetch(`https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/mquotes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(symbolsObj),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const result = await response.json();
        setMarketPrices(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);
  
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
    if (user?.id) {
      const fetchOrders = async () => {
        try {
          const response = await getStocks(user);
          setOrders(response.length > 0 ? response : []);
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      };

      fetchOrders();
    }
  }, [user]);

  return (
    <>
      <Navbar />
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
              {totalPL >= 0 ? '+' : '-'}{inrSymbol}{Math.abs(totalPL).toFixed(2)} 
              ({totalSpend !== 0 ? ((Math.abs(totalPL) / Math.abs(totalSpend)) * 100).toFixed(2) : '0.00'}%)
            </div>
          </div>  
        </div>
      </div>

      <h3 className='p-4 text-xl font-bold'>Portfolio</h3>
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
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td><Link to={`/stocks/${order.stock_name}`} className='text-blue-500'>{order.stock_name}</Link></td>
                  <td>{new Date(order.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                  <td className={order.type === "BUY" ? 'text-green-500' : 'text-orange-600'}>
                    {order.type}
                  </td>
                  <td>{order.quantity}</td>
                  <td>{inrSymbol}{order.stock_price}</td>
                  <td className={`pl-column ${getPLClass(order, index)}`}>
                    {getFormattedPL(order, index)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  function getPLClass(order, index) {
    const plValue = (convertedPrices[index] - order.stock_price) * order.quantity;
    return order.type === "BUY" ? (plValue >= 0 ? 'text-green-500' : 'text-orange-600') :
                                    (plValue < 0 ? 'text-green-500' : 'text-orange-600');
  }

  function getFormattedPL(order, index) {
    const plValue = (convertedPrices[index] - order.stock_price) * order.quantity;
    return `${order.type === "BUY" ? (plValue >= 0 ? '+' : '-') : (plValue < 0 ? '+' : '-')} 
           ${inrSymbol}${Math.abs(plValue).toFixed(2)} 
           (${((Math.abs(plValue)/Math.abs(order.stock_price * order.quantity))*100).toFixed(2)}%)`;
  }
}

export default Stocks;