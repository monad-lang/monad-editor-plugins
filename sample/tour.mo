/// A tour of Monad's syntax surface, for smoke-testing editor integrations.
///
/// Every declaration form the tree-sitter grammar knows, plus one of each
/// token class. Run it with `monad run tour.mo`, or check with
/// `monad check tour.mo`.
#![mote { name := "tour", deps := [init, std] }]

use std::io {}
open IO {println}

// --- Type declarations -------------------------------------------------

type Choice A {
  some (a : A),
  none
}

type Tree A {
  leaf,
  node (left : Tree A) (value : A) (right : Tree A)
}

struct Config {
  debug : Bool := false,
  label : String := "tour"
}

class Show A {
  def show (self : A) : String
}

instance Show Bool {
  def show (self : Bool) : String :=
    if self then "true" else "false"
}

infix (|>) := fun_apply

// --- Definitions -------------------------------------------------------

def Choice.map (f : A -> B) (self : Choice A) : Choice B :=
  match self {
    Choice.some a => Choice.some (f a),
    Choice.none => Choice.none
  }

def Tree.sum (self : Tree I64) : I64 :=
  match self {
    Tree.leaf => 0,
    Tree.node l v r => Tree.sum l + v + Tree.sum r
  }

// Structs are affine: a binder may be read once. `{ cfg with ... }` is the
// copy-and-update form, and it is how one struct reads become another.
def with_label (cfg : Config) (label : String) : Config :=
  { cfg with label := label }

def describe (cfg : Config) : String := cfg.label

def apply_twice (f : I64 -> I64) (x : I64) : I64 := f (f x)

// Do notation, bind, lambda, pipe, attributes.

#[test]
def test_option_map : Bool :=
  match Choice.map (fn (x : I64) => x * 2) (Choice.some 21) {
    Choice.some n => n == 42,
    Choice.none => false
  }

#[test]
def test_tree_sum : Bool :=
  Tree.sum (Tree.node Tree.leaf 2 (Tree.node Tree.leaf 3 Tree.leaf)) == 5

def main (args : List String) : IO Unit := do {
  let base : Config := { debug := true, label := "tour" };
  let cfg : Config <- IO.pure (with_label base "monad");
  let tree : Tree I64 := Tree.node (Tree.node Tree.leaf 1 Tree.leaf) 2 Tree.leaf;
  println (describe cfg);
  println ("tree sum: " ++ (Show.show (Tree.sum tree == 3)))
}
