# 结构体和枚举

结构体（Structs）和枚举（Enums）是 Solidity 中用于创建自定义数据类型的重要工具。它们帮助开发者组织复杂的数据结构，提高代码的可读性和可维护性。

## 结构体 (Structs)

### 基本结构体定义

```solidity
contract BasicStructs {
    // 定义用户结构体
    struct User {
        string name;
        uint age;
        address wallet;
        bool isActive;
    }
    
    // 定义产品结构体
    struct Product {
        uint id;
        string name;
        uint price;
        uint stock;
        address seller;
    }
    
    // 存储结构体
    User public admin;
    mapping(address => User) public users;
    Product[] public products;
    
    function createUser(
        string memory _name,
        uint _age
    ) public {
        // 方法1：直接赋值
        users[msg.sender] = User({
            name: _name,
            age: _age,
            wallet: msg.sender,
            isActive: true
        });
    }
    
    function createUserAlternative(
        string memory _name,
        uint _age
    ) public {
        // 方法2：先声明再赋值
        User memory newUser;
        newUser.name = _name;
        newUser.age = _age;
        newUser.wallet = msg.sender;
        newUser.isActive = true;
        
        users[msg.sender] = newUser;
    }
    
    function addProduct(
        string memory _name,
        uint _price,
        uint _stock
    ) public {
        products.push(Product({
            id: products.length,
            name: _name,
            price: _price,
            stock: _stock,
            seller: msg.sender
        }));
    }
}
```

### 嵌套结构体

```solidity
contract NestedStructs {
    struct Address {
        string street;
        string city;
        string country;
        uint zipCode;
    }
    
    struct Contact {
        string email;
        string phone;
    }
    
    struct Company {
        string name;
        Address location;
        Contact contact;
        uint employeeCount;
        bool isActive;
    }
    
    struct Employee {
        uint id;
        string name;
        string position;
        uint salary;
        Company company;  // 嵌套结构体
        Address homeAddress;
    }
    
    mapping(uint => Employee) public employees;
    mapping(address => Company) public companies;
    uint public nextEmployeeId = 1;
    
    function registerCompany(
        string memory _name,
        string memory _street,
        string memory _city,
        string memory _country,
        uint _zipCode,
        string memory _email,
        string memory _phone
    ) public {
        companies[msg.sender] = Company({
            name: _name,
            location: Address({
                street: _street,
                city: _city,
                country: _country,
                zipCode: _zipCode
            }),
            contact: Contact({
                email: _email,
                phone: _phone
            }),
            employeeCount: 0,
            isActive: true
        });
    }
    
    function addEmployee(
        string memory _name,
        string memory _position,
        uint _salary,
        string memory _homeStreet,
        string memory _homeCity,
        string memory _homeCountry,
        uint _homeZipCode
    ) public {
        require(companies[msg.sender].isActive, "Company not registered");
        
        uint employeeId = nextEmployeeId++;
        
        employees[employeeId] = Employee({
            id: employeeId,
            name: _name,
            position: _position,
            salary: _salary,
            company: companies[msg.sender],
            homeAddress: Address({
                street: _homeStreet,
                city: _homeCity,
                country: _homeCountry,
                zipCode: _homeZipCode
            })
        });
        
        companies[msg.sender].employeeCount++;
    }
    
    function getEmployeeInfo(uint _employeeId) public view returns (
        string memory name,
        string memory position,
        uint salary,
        string memory companyName,
        string memory homeCity
    ) {
        Employee memory emp = employees[_employeeId];
        return (
            emp.name,
            emp.position,
            emp.salary,
            emp.company.name,
            emp.homeAddress.city
        );
    }
}
```

### 结构体数组

```solidity
contract StructArrays {
    struct Transaction {
        address from;
        address to;
        uint amount;
        uint timestamp;
        string description;
        bool isCompleted;
    }
    
    Transaction[] public transactions;
    mapping(address => uint[]) public userTransactions;
    
    function createTransaction(
        address _to,
        uint _amount,
        string memory _description
    ) public {
        uint transactionId = transactions.length;
        
        transactions.push(Transaction({
            from: msg.sender,
            to: _to,
            amount: _amount,
            timestamp: block.timestamp,
            description: _description,
            isCompleted: false
        }));
        
        userTransactions[msg.sender].push(transactionId);
        userTransactions[_to].push(transactionId);
    }
    
    function completeTransaction(uint _transactionId) public {
        require(_transactionId < transactions.length, "Invalid transaction ID");
        require(
            transactions[_transactionId].to == msg.sender,
            "Only recipient can complete"
        );
        require(
            !transactions[_transactionId].isCompleted,
            "Transaction already completed"
        );
        
        transactions[_transactionId].isCompleted = true;
    }
    
    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }
    
    function getUserTransactions(address _user) public view returns (uint[] memory) {
        return userTransactions[_user];
    }
    
    function getTransactionDetails(uint _transactionId) public view returns (
        address from,
        address to,
        uint amount,
        uint timestamp,
        string memory description,
        bool isCompleted
    ) {
        require(_transactionId < transactions.length, "Invalid transaction ID");
        Transaction memory txn = transactions[_transactionId];
        
        return (
            txn.from,
            txn.to,
            txn.amount,
            txn.timestamp,
            txn.description,
            txn.isCompleted
        );
    }
}
```

## 枚举 (Enums)

### 基本枚举定义

```solidity
contract BasicEnums {
    // 定义订单状态枚举
    enum OrderStatus {
        Pending,    // 0
        Confirmed,  // 1
        Shipped,    // 2
        Delivered,  // 3
        Cancelled   // 4
    }
    
    // 定义用户角色枚举
    enum UserRole {
        Guest,      // 0
        User,       // 1
        Moderator,  // 2
        Admin       // 3
    }
    
    struct Order {
        uint id;
        address customer;
        uint amount;
        OrderStatus status;
        uint timestamp;
    }
    
    mapping(address => UserRole) public userRoles;
    mapping(uint => Order) public orders;
    uint public nextOrderId = 1;
    
    function setUserRole(address _user, UserRole _role) public {
        require(userRoles[msg.sender] == UserRole.Admin, "Only admin can set roles");
        userRoles[_user] = _role;
    }
    
    function createOrder(uint _amount) public {
        uint orderId = nextOrderId++;
        
        orders[orderId] = Order({
            id: orderId,
            customer: msg.sender,
            amount: _amount,
            status: OrderStatus.Pending,
            timestamp: block.timestamp
        });
    }
    
    function updateOrderStatus(uint _orderId, OrderStatus _status) public {
        require(orders[_orderId].id != 0, "Order does not exist");
        require(
            userRoles[msg.sender] == UserRole.Admin || 
            userRoles[msg.sender] == UserRole.Moderator,
            "Insufficient permissions"
        );
        
        orders[_orderId].status = _status;