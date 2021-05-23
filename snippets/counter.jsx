import React, { useState } from "react";
import { createContainer } from "../src/unstated-next";
import { render } from "react-dom";

function useCounter(initialState = 0) {
    let [count, setCount] = useState(initialState);

    let decrement = () => setCount(count - 1);
    let increment = () => setCount(count + 1);

    return { count, decrement, increment };
}

let Counter = createContainer(useCounter);

const CounterDisplay = () => {
    let counter = Counter.useContainer();

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
