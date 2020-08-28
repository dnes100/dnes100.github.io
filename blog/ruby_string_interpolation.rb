def generate_intro_letter(options = {})
  recipient = options[:recipient]
  messages = options[:messages]
  name = options[:name]

  [
    'Hello',
    (recipient),
    ('!,' if recipient),
    '\n\n',
    (messages.join('\n') if messages),
    ('\n\n' if messages),
    'Thanks :)',
    '\n',
    (options[:name] if name),
  ].compact.join(' ')
end

puts ""
puts "Version One:"
puts generate_intro_letter.gsub('\n', '<br />')


puts ""
puts "Version Two:"
messages = [
  'Ruby has few ways of composing strings dynamically.',
  'Eg: "a".concat "b", "a" + "b", "a#{b}", heredoc, etc.',
  'We can use array.join() method to compose long strings in a cleaner way.',
  'More effective for single liners but longer strings.',
]
puts generate_intro_letter({
  messages: messages,
}).gsub('\n', '<br />')


puts ""
puts "Version Three:"
puts generate_intro_letter({
  recipient: 'Fellow rubyists',
  messages: messages,
  name: 'Dinesh Hyaunmikha',
}).gsub('\n', '<br />')

