/** @jsx h */
import { h } from "nano-jsx";

function Score({ value }: { value: number }) {
  return (
    <svg viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="#ffffff"
        stroke-width="12"
      />
      <circle
        data-score={value}
        style={`--score: ${value}`}
        class="percent"
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="#ffc95d"
        stroke-width="12"
        pathLength="100"
      />
      {/* <text x="50%" y="50%" text-anchor="middle" fill="black" dy=".3em">
        {value}
      </text> */}
      <text
        x="50%"
        y="-50%"
        fill="black"
        transform="translate(0, 15)"
        text-anchor="middle"
        alignment-baseline="middle"
      >
        {value}
      </text>
    </svg>
  );
}

export { Score };
