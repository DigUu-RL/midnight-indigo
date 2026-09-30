mod shapes {
    pub trait Shape {
        type Unit;
        fn area(&self) -> Self::Unit;
    }

    pub struct Square<'a> {
        pub label: &'a str,
        pub side: u32,
    }

    impl<'a> Shape for Square<'a> {
        type Unit = u32;
        fn area(&self) -> u32 {
            self.side * self.side
        }
    }

    impl Square<'_> {
        pub fn new(label: &str) -> Square<'_> {
            Square { label, side: 1_u32 }
        }
    }
}

macro_rules! twice {
    ($value:expr) => {
        $value * 2
    };
}

fn describe(shape: Option<&shapes::Square>) -> String {
    if let Some(square) = shape {
        format!("{} is {}", square.label, twice!(square.side))
    } else {
        String::new()
    }
}
