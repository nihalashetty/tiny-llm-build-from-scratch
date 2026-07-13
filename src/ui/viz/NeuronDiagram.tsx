/**
 * A single labeled neuron — the "what are we even building?" picture. Two inputs
 * come in, each multiplied by a weight, summed with a bias, then squashed to a
 * 0–1 output. Purely illustrative (no live values); it's here to make the idea
 * concrete before the interactive demos.
 */
export function NeuronDiagram() {
  return (
    <svg viewBox="0 0 500 210" width="100%" role="img" aria-label="How one neuron works">
      <defs>
        <marker id="nd-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#c0b199" />
        </marker>
      </defs>

      {/* input nodes */}
      {[
        { y: 70, label: 'x₁', sub: 'input 1' },
        { y: 140, label: 'x₂', sub: 'input 2' },
      ].map((n, i) => (
        <g key={i}>
          <circle cx={54} cy={n.y} r={22} fill="#fff" stroke="#3e6ff0" strokeWidth="1.5" />
          <text x={54} y={n.y + 5} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="15" fill="#2b2622">
            {n.label}
          </text>
        </g>
      ))}

      {/* edges + weight labels */}
      <line x1={76} y1={70} x2={214} y2={98} stroke="#c0b199" strokeWidth="2" markerEnd="url(#nd-arrow)" />
      <line x1={76} y1={140} x2={214} y2={112} stroke="#c0b199" strokeWidth="2" markerEnd="url(#nd-arrow)" />
      <text x={140} y={72} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="12" fill="#c24a28">
        × w₁
      </text>
      <text x={140} y={142} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="12" fill="#c24a28">
        × w₂
      </text>

      {/* the neuron body */}
      <rect x={222} y={72} width={96} height={66} rx={16} fill="#26211d" />
      <text x={270} y={100} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="15" fill="#ffc98a">
        Σ add
      </text>
      <text x={270} y={122} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="13" fill="#a7c79a">
        σ squash
      </text>

      {/* bias */}
      <text x={270} y={162} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="12" fill="#857c72">
        + bias
      </text>

      {/* output */}
      <line x1={318} y1={105} x2={410} y2={105} stroke="#c0b199" strokeWidth="2" markerEnd="url(#nd-arrow)" />
      <circle cx={440} cy={105} r={24} fill="#fde7de" stroke="#f0663e" strokeWidth="1.5" />
      <text x={440} y={101} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="14" fill="#c24a28">
        ŷ
      </text>
      <text x={440} y={116} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#c24a28">
        0…1
      </text>

      <text x={250} y={26} textAnchor="middle" fontFamily="'Figtree', sans-serif" fontSize="13" fill="#857c72">
        output = σ( x₁·w₁ + x₂·w₂ + bias )
      </text>
    </svg>
  );
}
