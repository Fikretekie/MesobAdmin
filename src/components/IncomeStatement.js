import React, { useState, useEffect } from 'react';
import '../assets/css/IncomeStatement.css';

const IncomeStatement = ({ items }) => {
  const [commissionRevenue, setCommissionRevenue] = useState(0);
  const [feeExpense, setFeeExpense] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);
  function calculateCommissionRevenue(items) {
    const totalCommission = items.reduce((sum, transaction) => {
      if (transaction.type === 0) {
        const sheepProviderCost = parseFloat(transaction.sheepGoatCost || '0');
        const generalProviderCost = parseFloat(transaction.generalProductsCost || '0');
        const totalCost = parseFloat(transaction.totalCost || '0');
        
        const commissionRevenue = (sheepProviderCost + generalProviderCost) - totalCost;
        return sum + commissionRevenue;
      }
      return sum;
    }, 0);
  
    return Math.abs(totalCommission).toFixed(2);
  }
  function calculateFeeExpense(items) {
    return items.reduce((acc, transaction) => {
      if (transaction.type === 1) {
        if (transaction.transactiontype && transaction.transactiontype.toLowerCase() === 'payable') {
          acc.totalFee += parseFloat(transaction.credit || '0'); // Add credit value for payable transactions
        }
      }
      return acc;
    }, { totalFee: 0 });
  }
 


 
  useEffect(() => {
    if (items.length > 0) {
      setCommissionRevenue(parseFloat(calculateCommissionRevenue(items)));
      const { totalFee, totalPayable } = calculateFeeExpense(items);
      setFeeExpense(totalFee);
    } else {
      setCommissionRevenue(0);
      setFeeExpense(0);
    }
  }, [items]);

  const calculateNetIncome = () => {
    return (commissionRevenue - feeExpense).toFixed(2);
  };

  if (items.length === 0) {
    return <div className="income-statement">No data available for Income Statement</div>;
  }

  return (
    <div className="income-statement">
      <h1>Income Statement</h1>
      <div className="statement-table">
        <table>
          <tbody>
            <tr>
              <td><strong>Revenue</strong></td>
              <td></td>
            </tr>
            <tr>
              <td>Commission Revenue</td>
              <td className="statement-value statement-value--revenue">
                {commissionRevenue}$
              </td>
            </tr>
            <tr>
              <td><strong>Expense</strong></td>
              <td></td>
            </tr>
            <tr>
              <td>Fee Expense</td>
              <td className="statement-value statement-value--expense">
                {feeExpense}$
              </td>
            </tr>
            <tr>
              <td><strong>Net Income</strong></td>
              <td className="statement-value statement-value--net">
                {calculateNetIncome()}$
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomeStatement;