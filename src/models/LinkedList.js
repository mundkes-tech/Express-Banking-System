const Node = require('./Node');

class LinkedList {
  constructor() {
    this.head = null;
  }

  insert(data) {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode;
    } else {
      let temp = this.head;
      while (temp.next) {
        temp = temp.next;
      }
      temp.next = newNode;
    }
  }

  find(accountNumber) {
    let temp = this.head;
    while (temp) {
      if (temp.data.accountNumber === accountNumber) {
        return temp.data;
      }
      temp = temp.next;
    }
    return null;
  }

  getAll() {
    const results = [];
    let temp = this.head;
    while (temp) {
      results.push(temp.data);
      temp = temp.next;
    }
    return results;
  }
}

module.exports = LinkedList;
