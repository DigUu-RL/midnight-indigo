using System;

namespace Workspace.Corpus;

[Serializable]
public readonly record struct Point(int X, int Y);

public struct Size
{
    public const int Max = 4096;
    public int Width { get; init; }
}

public static class Shapes
{
    public static Point Origin => new(0, 0);

    public static string Describe<T>(T? shape) where T : class =>
        shape switch
        {
            null => "none",
            Point { X: 0 } p when p.Y > 0 => "axis",
            _ => shape.ToString() ?? string.Empty,
        };

    public static Point operator +(Point left, Point right) => new(left.X + right.X, left.Y + right.Y);
}
