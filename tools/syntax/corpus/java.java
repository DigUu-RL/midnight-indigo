package workspace.corpus;

import java.util.List;

public record Point(int x, int y) {}

@FunctionalInterface
interface Shape {
    double area();
}

public final class Shapes {
    private static final int LIMIT = 10;

    @Override
    public String toString() {
        List<Point> points = List.of(new Point(0, 0));
        return points.size() > LIMIT ? "many" : "few";
    }
}
