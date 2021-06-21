import React, { useState } from "react";
import { render } from "react-dom";
import { createContainer } from "../src/unstated-next";

const useCounter = (initialState = 0) => {
    const [count, setCount] = useState(initialState);

    const decrement = () => setCount(count - 1);
    const increment = () => setCount(count + 1);

    return { count, decrement, increment };
};

const Counter = createContainer(useCounter);

const CounterDisplay = () => {
    const counter = Counter.useContainer();

    return (
        <div>
            <button onClick={counter.decrement}>-</button>
            <span>{counter.count}</span>
            <button onClick={counter.increment}>+</button>
        </div>
    );
};

const App = () => (
    <Counter.Provider>
        <CounterDisplay />
        <Counter.Provider initialState={2}>
            <div>
                <div>
                    <CounterDisplay />
                </div>
            </div>
        </Counter.Provider>
    </Counter.Provider>
);

render(<App />, document.getElementById("root"));
