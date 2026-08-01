import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Input,
  Spinner,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Table,
  Form,
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
  FormGroup,
  Label,
  Popover,
  PopoverBody,
} from "reactstrap";
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import axios from "axios";
import formatDate from "utils/formatDate";
import { Helmet } from "react-helmet";
import NotificationAlert from "react-notification-alert";
import "react-notification-alert/dist/animate.css";
import formatUserId from "utils/formatUID";
import { Editor } from "@tinymce/tinymce-react";
import { FixedSizeList as List } from 'react-window';
import './TransactionTable.css';
import { AddExpenseButton } from "components/AddExpenseButton";
import IncomeStatement from "../components/IncomeStatement";
import BalanceSheet from "components/BalanceSheet";
import { BsTrashFill } from 'react-icons/bs';

function MesobFinancial() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMultiUsers, setModalMultiUsers] = useState(false); // Modal state
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const notificationAlertRef = useRef(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [searchedDates, setSearchedDates] = useState(null);

  const notify = (place, message, type) => {
    const options = {
      place: place,
      message: (
        <div>
          <div>{message}</div>
        </div>
      ),
      type: type,
      icon: "now-ui-icons ui-1_bell-53",
      autoDismiss: 7,
    };
    notificationAlertRef.current.notificationAlert(options);
  };

  const filterItemsByTimeRange = (items, range) => {
    if (!range.from || !range.to) return items;
    const fromDate = new Date(range.from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(range.to);
    toDate.setHours(23, 59, 59, 999);
    return items.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= fromDate && itemDate <= toDate;
    });
  };

  useEffect(() => {
    axios
      .get("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/MesobFinancial")
      .then((response) => {
        if (response) {
          setItems(response.data.Items);
          console.log('resopopo', response.data.Items);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was an error fetching the items!", error);
      });
  }, []);

  const handleSelectRange = (range) => {
    setSelectedTimeRange(range);
  };

  const filteredItems = filterItemsByTimeRange(items, selectedTimeRange);

  // const calculateTotalCashOnHand = (items) => {
  //   const total = items.reduce((total, transaction) => {
  //     const amount = parseFloat(transaction.totalCost) || 0;
  //     console.log('amount=>>', amount);
  //     console.log('amount=>>', transaction);

  //     if (transaction.type === 0) {
  //       // Income: add to total
  //       return total + amount;
  //     } else if (transaction.type === 1) {
  //       // Expense
  //       const transactionType = transaction.transactiontype.toLowerCase();
  //       if (
  //         transactionType === 'cash - payable to sheep provider' ||
  //         transactionType === 'cash - payable to general' ||
  //         transactionType === 'cash - payable to miscellaneous expenses'
  //       ) {
  //         const credit = parseFloat(transaction.credit) || 0;
  //         return total - credit;
  //       } else if (transactionType === 'payable') {
  //         return total;
  //       }
  //     }
  //     // Default case: return current total
  //     return total;
  //   }, 0);

  //   return Math.abs(total).toFixed(2);
  // };
  const calculateTotalCashOnHand = (items) => {
    const total = items.reduce((total, transaction) => {
      const amount = parseFloat(transaction.totalCost) || 0;
      if (transaction.type === 0) {
        // Income: add to total
        return total + amount;
      } else if (transaction.type === 1) {
        // Expense
        const transactionType = transaction.transactiontype.toLowerCase();
        if (
          transactionType === 'cash - payable to sheep provider' ||
          transactionType === 'cash - payable to general' ||
          transactionType === 'cash - payable to miscellaneous expenses'
        ) {
          const credit = parseFloat(transaction.credit) || 0;
          return total - credit;
        } else if (transactionType === 'payable') {
          return total;
        }
      }
      // Default case: return current total
      return total;
    }, 0);

    // Format the total: add negative sign if total < 0
    return total < 0 ? `-${Math.abs(total).toFixed(2)}` : total.toFixed(2);
  };

  // function calculateTotalPayable(items) {
  //   const total = items.reduce((sum, transaction) => {
  //     if (transaction.type === 0) {
  //       const sheepGoatCost = parseFloat(transaction.sheepGoatCost) || 0;
  //       const generalProductsCost = parseFloat(transaction.generalProductsCost) || 0;
  //       return sum + sheepGoatCost + generalProductsCost;
  //     } else if (transaction.type === 1) {
  //       const transactionType = transaction.transactiontype.toLowerCase();
  //       const totalCost = parseFloat(transaction.totalCost) || 0;

  //       if (transactionType === 'payable') {
  //         return sum + totalCost;
  //       } else if (
  //         transactionType === 'cash - payable to sheep provider' ||
  //         transactionType === 'cash - payable to general' ||
  //         transactionType === 'cash - payable to miscellaneous expenses'
  //       ) {
  //         return sum - totalCost;
  //       }
  //     }
  //     return sum;
  //   }, 0);

  //   return Math.abs(total).toFixed(2);
  // }

  function calculateTotalPayable(items) {
    const total = items.reduce((sum, transaction) => {
      if (transaction.type === 0) {
        const sheepGoatCost = parseFloat(transaction.sheepGoatCost) || 0;
        const generalProductsCost = parseFloat(transaction.generalProductsCost) || 0;
        return sum + sheepGoatCost + generalProductsCost;
      } else if (transaction.type === 1) {
        const transactionType = transaction.transactiontype?.toLowerCase() || '';
        const totalCost = parseFloat(transaction.totalCost) || 0;

        if (transactionType === 'payable') {
          return sum + totalCost;
        } else if (
          transactionType === 'cash - payable to sheep provider' ||
          transactionType === 'cash - payable to general' ||
          transactionType === 'cash - payable to miscellaneous expenses'
        ) {
          return sum - totalCost;
        }
      }
      return sum;
    }, 0);

    return total < 0 ? `-${Math.abs(total).toFixed(2)}` : total.toFixed(2);
  }

  // function calculateSheepPayable(items) {
  //   const total = items.reduce((sum, transaction) => {
  //     console.log(transaction, 'transaction=>>>', sum);
  //     if (transaction.type === 0) {
  //       const sheepGoatCost = parseFloat(transaction.sheepGoatCost || '0');
  //       console.log('payable=>>>>0', sheepGoatCost);
  //       return sum + sheepGoatCost;
  //     } else if (transaction.type === 1 && transaction.transactiontype === 'cash - Payable to Sheep Provider') {
  //       console.log('payable=>>>>1', transaction.totalCost);
  //       return sum - parseFloat(transaction.totalCost || '0');
  //     }
  //     return sum;
  //   }, 0);
  //   return Math.abs(total).toFixed(2);
  // }


  function calculateSheepPayable(items) {
    const total = items.reduce((sum, transaction) => {
      console.log(transaction, 'transaction=>>>', sum);
      if (transaction.type === 0) {
        const sheepGoatCost = parseFloat(transaction.sheepGoatCost || '0');
        console.log('payable=>>>>0', sheepGoatCost);
        return sum + sheepGoatCost;
      } else if (transaction.type === 1 && transaction.transactiontype.toLowerCase() === 'cash - payable to sheep provider') {
        console.log('payable=>>>>1', transaction.totalCost);
        return sum - parseFloat(transaction.totalCost || '0');
      }
      return sum;
    }, 0);
    return total < 0 ? `-${Math.abs(total).toFixed(2)}` : total.toFixed(2);
  }

  // function calculateGeneralPayable(items) {
  //   console.log('items =>>> ', items);
  //   const total = items.reduce((sum, transaction) => {
  //     console.log('transaction =>>> ', transaction);

  //     if (transaction.type === 0) {
  //       const generalProductsCost = parseFloat(transaction.generalProductsCost || '0');
  //       console.log('generalProductsCost=>>>0', generalProductsCost);
  //       return sum + generalProductsCost;
  //     } else if (transaction.type === 1 && transaction.transactiontype === 'cash - Payable to General') {
  //       console.log('generalProductsCost=>>>1', transaction.totalCost);
  //       return sum - parseFloat(transaction.totalCost || '0');
  //     }
  //     console.log('generalProductsCost=>>>1', transaction.totalCost);

  //     console.log('generalProductsCost=>>>sum', sum);
  //     return sum;
  //   }, 0);

  //   return Math.abs(total).toFixed(2);
  // }


  function calculateGeneralPayable(items) {
    console.log('items =>>> ', items);
    const total = items.reduce((sum, transaction) => {
      console.log('transaction =>>> ', transaction);

      if (transaction.type === 0) {
        const generalProductsCost = parseFloat(transaction.generalProductsCost || '0');
        console.log('generalProductsCost=>>>0', generalProductsCost);
        return sum + generalProductsCost;
      } else if (transaction.type === 1 && transaction.transactiontype.toLowerCase() === 'cash - payable to general') {
        console.log('generalProductsCost=>>>1', transaction.totalCost);
        return sum - parseFloat(transaction.totalCost || '0');
      }

      console.log('generalProductsCost=>>>sum', sum);
      return sum;
    }, 0);

    return total < 0 ? `-${Math.abs(total).toFixed(2)}` : total.toFixed(2);
  }

  function calculateMiscPayable(items) {
    const total = items.reduce((sum, transaction) => {
      if (transaction.type === 1) {
        if (transaction.transactiontype === 'payable') {
          return sum + (parseFloat(transaction.totalCost) || 0);
        } else if (transaction.transactiontype === 'cash - Payable to Miscellaneous Expenses') {
          return sum - (parseFloat(transaction.totalCost) || 0);
        }
      }
      return sum;
    }, 0);

    return Math.abs(total).toFixed(2);
  }

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

  function calculateTotalExpense(items) {
    return items.reduce((sum, transaction) => {
      if (transaction.type === 1 && transaction.transactiontype && transaction.transactiontype.toLowerCase() === 'payable') {
        return sum + (parseFloat(transaction.totalCost) || 0);
      }
      return sum;
    }, 0).toFixed(2);
  }

  const handleAddExpense = (expense) => {
    console.log('New expense:', expense);
    // Here you would typically update your state or send data to your backend
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setLoading(true);
      axios.delete(`https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/MesobFinancial/expense?id=` + id,)
        .then(() => {
          notify("tr", "Record deleted successfully", "success");
          // Reload the page
          window.location.reload();
        })
        .catch((error) => {
          console.error("Error deleting record:", error);
          notify("tr", "Failed to delete record", "danger");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleDeleteAllRecords = () => {
    setShowDeleteConfirmation(true);
  };

  const handleClearFilters = () => {
    setSelectedTimeRange('all');
  };

  const confirmDelete = () => {
    setLoading(true);
    axios.delete("https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/MesobFinancial")
      .then((response) => {
        setItems([]);
        setLoading(false);
        notify("tr", "All records deleted successfully", "success");
      })
      .catch((error) => {
        console.error("Error deleting records:", error);
        setLoading(false);
        notify("tr", "Failed to delete records", "danger");
      });
    setShowDeleteConfirmation(false);
  };

  const RunButtons = ({ onSelectRange, onClearFilters }) => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const handleRun = () => {
      if (fromDate && toDate) {
        onSelectRange({ from: fromDate, to: toDate });
        setSearchedDates({ from: fromDate, to: toDate });

      } else {
        alert('Please select both From and To dates');
      }
    };

    const handleClear = () => {
      setFromDate('');
      setToDate('');
      onClearFilters();
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <FormGroup style={{ marginRight: '10px' }}>
          <Label for="fromDate">From</Label>
          <Input
            type="date"
            id="fromDate"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </FormGroup>
        <FormGroup style={{ marginRight: '10px' }}>
          <Label for="toDate">To</Label>
          <Input
            type="date"
            id="toDate"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </FormGroup>
        <Button color="primary" onClick={handleRun} style={{ marginRight: '10px' }}>
          Run
        </Button>
        <Button color="secondary" onClick={handleClear}>
          Clear Filters
        </Button>
      </div>
    );
  };

  const TransactionTable = ({ }) => {
    const filteredItems = filterItemsByTimeRange(items, selectedTimeRange);
    const sortedTransactions = [...filteredItems].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    const totalTransactions = sortedTransactions.length;

    const getValueColor = (transactionType, fallback = "#fda4af") => {
      const normalizedType = String(transactionType || "").toLowerCase();

      if (normalizedType === "payable") return "#fda4af";
      if (normalizedType === "cash - payable to sheep provider") return "#7dd3fc";
      if (normalizedType === "cash - payable to general") return "#bef264";
      if (normalizedType === "cash - payable to miscellaneous expenses") {
        return "#facc15";
      }

      return fallback;
    };

    const valueStyle = (color) => ({
      color,
      fontWeight: 700,
      background: "transparent",
    });


    return (
      <div className="table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sr. Number</th>
              <th>Transaction</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction, index) => (
              <tr key={index} className={transaction.type === 1 ? "expense-row" : ""}>
                <td>{transaction.date}</td>
                <td>{totalTransactions - index}</td>
                {transaction.type === 1 ? (
                  <td>
                    <div>{transaction.expensename || "Expense"}</div>
                    <div>{transaction.transactiontype || "Cash"}</div>
                  </td>
                ) : (
                  <td>
                    <div>Cash</div>
                    {transaction?.generalProductsCost && transaction?.generalProductsCost !== '0.00' && <div>Payable to general provider</div>}
                    {transaction?.sheepGoatCost && transaction?.sheepGoatCost !== '0.00' && <div>Payable to sheep provider</div>}
                    <div>Commission Revenue</div>
                  </td>
                )}
                {transaction.type === 1 ? (
                  <td className="debit">
                    <div style={valueStyle(getValueColor(transaction.transactiontype))}>
                      {transaction.totalCost}$
                    </div>
                    <div>-</div>
                  </td>
                ) : (
                  <td className="debit">
                    <div style={valueStyle("#fde68a")}>{transaction.totalCost}$</div>
                    {transaction?.sheepGoatCost && transaction?.sheepGoatCost !== '0.00' && <div>-</div>}
                    {transaction?.generalProductsCost && transaction?.generalProductsCost !== '0.00' && <div>-</div>}
                    <div>-</div>
                  </td>
                )}
                {transaction.type === 1 ? (
                  <td  >
                    <td className="credit" style={{ borderWidth: 0, width: '100%', }}>
                      <div>-</div>
                      <div style={valueStyle(getValueColor(transaction.transactiontype))}>
                        {transaction.credit}$</div>
                    </td>
                    <td style={{ borderWidth: 0, }}>

                      {transaction.type === 1 && (
                        <BsTrashFill
                          className="delete-btn"
                          onClick={() => handleDelete(transaction.id)}
                          style={{ cursor: 'pointer', color: '#e10d05' }}
                        />
                      )}

                    </td>
                  </td>
                ) : (
                  <td className="credit">
                    <div>-</div>
                    {transaction?.generalProductsCost && transaction?.generalProductsCost !== '0.00' && (
                      <div style={valueStyle("#bef264")}>{transaction.generalProductsCost}$</div>
                    )}
                    {transaction?.sheepGoatCost && transaction?.sheepGoatCost !== '0.00' && (
                      <div style={valueStyle("#7dd3fc")}>{transaction.sheepGoatCost}$</div>
                    )}
                    <div style={valueStyle("#f9a8d4")}>
                      {(() => {
                        const sheepGoatCost = parseFloat(transaction?.sheepGoatCost || 0);
                        const generalProductsCost = parseFloat(transaction?.generalProductsCost || 0);
                        const totalCost = parseFloat(transaction?.totalCost || 0);
                        const result = (sheepGoatCost + generalProductsCost - totalCost).toFixed(2);
                        return `${Math.abs(parseFloat(result)).toFixed(2)}$`;
                      })()}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ width: '100%', padding: 20, justifyContent: 'center' }}>
          <AddExpenseButton onAddExpense={handleAddExpense} />
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Mesob Financial - Mesob Store</title>
      </Helmet>

      <PanelHeader
        size="sm"
        content={
          <div className="header text-center" style={{ paddingTop: 16 }}>
            <h2 className="title">Mesob Financial Report</h2>
          </div>
        }
      />
      <NotificationAlert ref={notificationAlertRef} />

      <div className="content">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div style={{ display: "flex", flexDirection: 'row', paddingInline: 25, alignItems: "center", justifyContent: "space-between" }}>
                  <CardTitle tag="h4">Journal Entry</CardTitle>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }} >
                    <RunButtons onSelectRange={handleSelectRange} onClearFilters={handleClearFilters} />
                    <Button color="danger" onClick={handleDeleteAllRecords} style={{ marginLeft: '10px', marginTop: 19, height: 37 }}>
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spinner color="primary" />
                    <p>Loading ...</p>
                  </div>
                ) : (
                  <>
                    {selectedTimeRange && selectedTimeRange.from && selectedTimeRange.to && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong>Searched dates:</strong> {selectedTimeRange.from} - {selectedTimeRange.to}
                      </div>
                    )}
                    <TransactionTable />
                    <div style={{ margin: 20 }}>
                      <div style={{ display: 'inline-block', display: 'flex', flexDirection: 'row' }}>
                        <p style={{ borderWidth: 5, borderColor: 'grey', padding: 10 }}>Total Cash on hand =</p>
                        <p style={{ borderWidth: 5, borderColor: 'grey', padding: 10, color: '#fde68a', fontWeight: 700 }}>
                          {calculateTotalCashOnHand(filteredItems)}$
                        </p>
                      </div>

                      <div style={{ display: 'inline-block', display: 'flex', flexDirection: 'row' }}>
                        <p style={{ borderWidth: 5, borderColor: 'grey', padding: 10 }}>Total Payable (Unpaid)=</p>
                        <p style={{ borderWidth: 5, borderColor: 'grey', padding: 10, color: '#c4b5fd', fontWeight: 700 }}>
                          {calculateTotalPayable(filteredItems)}$
                        </p>
                      </div>
                      <div style={{ display: 'flex', marginLeft: 20, flexDirection: 'row', gap: '20px' }}>
                        <p style={{ fontSize: 12 }}>Payable to sheep/goat = <span style={{ padding: 10, color: '#60a5fa', fontWeight: 'bold' }}>{calculateSheepPayable(filteredItems)}$</span></p>
                        <p style={{ fontSize: 12 }}>Payable to general = <span style={{ padding: 10, color: '#c084fc', fontWeight: 'bold' }}>{calculateGeneralPayable(filteredItems)}$</span></p>
                        <p style={{ fontSize: 12 }}>Payable to miscellaneous = <span style={{ padding: 10, color: '#facc15', fontWeight: 'bold' }}>{calculateMiscPayable(filteredItems)}$</span></p>
                      </div>

                      <div style={{ display: 'inline-block', display: 'flex', flexDirection: 'row' }}>
                        <p style={{ borderWidth: 5, borderColor: 'grey', padding: 10 }}>Commission Revenue =</p>
                        <p style={{ borderWidth: 5, borderColor: 'grey', padding: 10, color: '#f9a8d4', fontWeight: 700 }}>
                          {calculateCommissionRevenue(filteredItems)}$
                        </p>
                      </div>

                      <div style={{ display: 'inline-block', display: 'flex', flexDirection: 'row' }}>
                        <p style={{ borderWidth: 5, borderColor: 'grey', padding: 10 }}>Total Expense  =</p>
                        <p style={{ borderWidth: 5, borderColor: 'grey', padding: 10, color: '#fda4af', fontWeight: 700 }}>
                          {calculateTotalExpense(filteredItems)}$
                        </p>
                      </div>

                    </div>
                  </>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <IncomeStatement items={filteredItems} />
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BalanceSheet items={filteredItems} />
              </CardHeader>
            </Card>
          </Col>
        </Row>
        {/* Confirmation Modal */}
        <Modal isOpen={showDeleteConfirmation} toggle={() => setShowDeleteConfirmation(false)}>
          <ModalHeader toggle={() => setShowDeleteConfirmation(false)}>Confirm Delete</ModalHeader>
          <ModalBody>
            Are you sure you want to delete all records? This action cannot be undone.
          </ModalBody>
          <div className="modal-footer">
            <Button color="secondary" onClick={() => setShowDeleteConfirmation(false)}>No</Button>
            <Button color="danger" onClick={confirmDelete}>Yes, Delete All</Button>
          </div>
        </Modal>
      </div>
    </>
  );
}

export default MesobFinancial;
