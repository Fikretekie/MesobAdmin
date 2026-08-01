import axios from 'axios';
import React, { useRef, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Input } from 'reactstrap';
import NotificationAlert from "react-notification-alert";

export const AddExpenseButton = ({ onAddExpense }) => {
  const [modal, setModal] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [debitValue, setDebitValue] = useState('');
  const [creditValue, setCreditValue] = useState('');
  const [transactiontype, setTransactiontype] = useState('cash - Payable to Sheep Provider');
  const notificationAlertRef = useRef(null);

  const toggle = () => setModal(!modal);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post(`https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/MesobFinancial/expense?debit=${debitValue}&credit=${creditValue}&expensename=${expenseName}&transactiontype=${transactiontype}`)
      .then((response) => {
        if (response.status === 200) {
          notify("tr", "Expense added successfully!", "success");
          console.log('transactiontype=<>>', transactiontype);
          onAddExpense({ expenseName, debitValue, creditValue, transactiontype });
          setModal(false);
          // Reset form fields
          setExpenseName('');
          setDebitValue('');
          setCreditValue('');
          setTransactiontype('cash - Payable to Sheep Provider');

          // Reload the page after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500); // 1.5 seconds delay
        }
      })
      .catch((error) => {
        console.error("There was an error adding the expense!", error);
        notify("tr", "Error adding expense. Please try again.", "danger");
      });
  };

  return (
    <div>
      <NotificationAlert ref={notificationAlertRef} />

      <div
        style={{
          width: '100%',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(96, 165, 250, 0.22)',
          padding: '10px',
          borderRadius: '10px',
          cursor: 'pointer'
        }}
        onClick={toggle}
      >
        <p style={{ textAlign: 'center', margin: 0, color: '#dbe7ff' }}>+ Add Transaction</p>
      </div>

      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>Add Transaction</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label for="expenseName">Expense Name</Label>
              <Input
                type="text"
                name="expenseName"
                id="expenseName"
                placeholder="Enter expense name"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="debitValue">Debit Value</Label>
              <Input
                type="number"
                name="debitValue"
                id="debitValue"
                placeholder="Enter debit value"
                value={debitValue}
                onChange={(e) => setDebitValue(e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="creditValue">Credit Value</Label>
              <Input
                type="number"
                name="creditValue"
                id="creditValue"
                placeholder="Enter credit value"
                value={creditValue}
                onChange={(e) => setCreditValue(e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="transactiontype">Transaction Type</Label>
              <Input
                type="select"
                name="transactiontype"
                id="transactiontype"
                value={transactiontype}
                onChange={(e) => setTransactiontype(e.target.value)}
                required
              >
                <option value="cash - Payable to Sheep Provider">Cash (Payable to Sheep Provider)</option>
                <option value="cash - Payable to General">Cash (Payable to General)</option>
                <option value="cash - Payable to Miscellaneous Expenses">Cash (Payable to Miscellaneous Expenses)</option>
                <option value="payable">Payable</option>
              </Input>
            </FormGroup>
            <Button color="primary" type="submit">Add Expense</Button>{' '}
            <Button color="secondary" onClick={toggle}>Cancel</Button>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  );
};