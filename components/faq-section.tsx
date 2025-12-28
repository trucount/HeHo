"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is HeHo?",
    answer:
      "HeHo is a no-code platform that allows you to build AI chatbots connected to your own data. You can integrate it with your Supabase database, upload project context, and deploy a chatbot that understands your business.",
  },
  {
    question: "What AI models can I use?",
    answer:
      "HeHo provides access to over 35 free AI models from OpenRouter, including popular models like Llama, Mistral, and Gemma. You can choose the model that best suits your needs and switch at any time.",
  },
  {
    question: "How does the Supabase integration work?",
    answer:
      "You can connect your Supabase project to HeHo by providing your credentials. The AI can then be granted permissions to read, write, and even create tables in your database, allowing it to perform autonomous actions based on user conversations.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, your data is secure. We use industry-standard encryption and security practices. For Supabase integration, you have fine-grained control over the AI's database permissions, ensuring it only accesses what you allow.",
  },
  {
    question: "What happens if I exceed my plan's limits?",
    answer:
      "Our free plan includes 10,000 messages per month. If you exceed this limit, we will notify you. You will have the option to upgrade to a paid plan to continue using the service without interruption.",
  },
  {
    question: "Can I customize the chatbot's appearance?",
    answer:
      "Currently, we are focused on providing a powerful backend and API for your chatbots. While there are some basic customization options, advanced styling is not yet available. However, you can use our API to build your own custom chat interface.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about HeHo's AI chatbot builder.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}