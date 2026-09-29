package workspace.corpus

import kotlin.math.max

data class Point(val x: Int, val y: Int = 0)

interface Shape {
    val area: Double
}

@JvmInline
value class Meters(val value: Double)

fun <T : Comparable<T>> largest(items: List<T>): T? {
    var best: T? = null
    for (item in items) {
        best = if (best == null) item else maxOf(best, item)
    }
    return best
}

class Circle(private val radius: Double) : Shape {
    override val area: Double get() = Math.PI * radius * radius
}
