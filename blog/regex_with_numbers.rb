
# Create a new intermediate (proxy) class to forward '===' method call
class DnesRegexp
  def initialize(pattern)
    @pattern = pattern
  end

  def ===(input)
    @pattern === input.to_s
  end
end

puts DnesRegexp.new(//) === nil
puts DnesRegexp.new(/1234/) === 1234
puts DnesRegexp.new(/1234/) === 15234
