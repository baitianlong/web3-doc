# 结构体和枚举

结构体（Struct）和枚举（Enum）是 Solidity 中常用的自定义数据类型，用于组织和管理复杂的数据结构。合理使用结构体和枚举可以让合约代码更清晰、可维护性更高。

## 结构体（Struct）

### 结构体定义与使用

```solidity
contract StructExample {
    // 定义结构体
    struct User {
        uint id;
        string name;
        address account;
        bool isActive;
    }

    // 结构体数组
    User[] public users;
    // 地址到结构体的映射
    mapping(address => User) public userInfo;

    // 添加用户
    function addUser(uint _id, string memory _name) public {
        User memory newUser = User({
            id: _id,
            name: _name,
            account: msg.sender,
            isActive: true
        });
        users.push(newUser);
        userInfo[msg.sender] = newUser;
    }

    // 获取用户信息
    function getUser(uint index) public view returns (User memory) {
        return users[index];
    }

    // 修改结构体字段
    function deactivateUser(uint index) public {
        users[index].isActive = false;
    }

    // 删除用户（将最后一个移到删除位置）
    function removeUser(uint index) public {
        require(index < users.length, "Index out of bounds");
        users[index] = users[users.length - 1];
        users.pop();
    }
}
```

### 结构体嵌套与数组

```solidity
contract NestedStructs {
    struct Book {
        string title;
        Author author;
    }
    struct Author {
        string name;
        uint birthYear;
    }
    Book[] public books;

    function addBook(string memory _title, string memory _author, uint _year) public {
        books.push(Book({
            title: _title,
            author: Author({name: _author, birthYear: _year})
        }));
    }
}
```

### 内存中的结构体

```solidity
contract MemoryStruct {
    struct Point { uint x; uint y; }
    function createPoint(uint _x, uint _y) public pure returns (Point memory) {
        Point memory p = Point(_x, _y);
        return p;
    }
}
```

## 枚举（Enum）

### 枚举定义与使用

```solidity
contract EnumExample {
    // 定义枚举
    enum Status { Pending, Active, Inactive, Deleted }

    Status public currentStatus;
    mapping(address => Status) public userStatus;

    // 设置状态
    function setStatus(Status _status) public {
        currentStatus = _status;
        userStatus[msg.sender] = _status;
    }

    // 获取状态
    function getStatus() public view returns (Status) {
        return currentStatus;
    }

    // 判断状态
    function isActive(address user) public view returns (bool) {
        return userStatus[user] == Status.Active;
    }
}
```

### 枚举与结构体结合

```solidity
contract OrderManager {
    enum OrderStatus { Created, Paid, Shipped, Completed, Cancelled }
    struct Order {
        uint id;
        address buyer;
        uint amount;
        OrderStatus status;
    }
    Order[] public orders;

    function createOrder(uint _id, uint _amount) public {
        orders.push(Order({
            id: _id,
            buyer: msg.sender,
            amount: _amount,
            status: OrderStatus.Created
        }));
    }

    function updateStatus(uint index, OrderStatus _status) public {
        require(index < orders.length, "Index out of bounds");
        orders[index].status = _status;
    }
}
```

## 关键点说明

- 结构体可嵌套、可与数组和映射结合使用
- 结构体和枚举可声明为 storage、memory 或 calldata 类型
- 枚举的底层是 uint 类型，从 0 开始递增
- 枚举适合用于状态机、权限等有限状态场景

## 最佳实践

- 合理设计结构体字段，避免过大结构体导致 Gas 浪费
- 枚举命名应简洁明了，避免歧义
- 结构体和枚举建议与事件、错误等配合使用，提升可读性
- 结构体数组删除时可用“最后一项覆盖法”节省 Gas

---

## 下一步操作

1. **动手实践**：编写一个订单管理合约，使用结构体和枚举管理订单状态。
2. **进阶挑战**：实现结构体嵌套、结构体数组与映射的组合应用。
3. **深入阅读**：
   - [Solidity 官方文档：结构体](https://docs.soliditylang.org/en/latest/types.html#structs)
   - [Solidity 官方文档：枚举](https://docs.soliditylang.org/en/latest/types.html#enums)