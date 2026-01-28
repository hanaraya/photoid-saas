import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Are my photos private?',
    answer:
      'Yes, 100%. All photo processing happens entirely in your browser using AI models that run on your device. Your photos are never uploaded to our servers or any third party. We physically cannot see your photos.',
  },
  {
    question: 'Will my photo be accepted at the passport office?',
    answer:
      'Our AI checks your photo against official government specifications including head size, eye position, and background color. We support 20+ country standards. However, final acceptance is always at the discretion of the issuing authority.',
  },
  {
    question: 'What countries are supported?',
    answer:
      "We support US Passport, UK Passport, EU/Schengen, Canada, India, Australia, China, Japan, South Korea, Germany, France, Brazil, Mexico, and many more. We also support visa photos for US, UK, Schengen, India, and China visas, plus US Driver's License and Green Card.",
  },
  {
    question: 'How does background removal work?',
    answer:
      'We use advanced AI (running in your browser) to automatically detect and remove the background from your photo, replacing it with a clean white background that meets government requirements.',
  },
  {
    question: 'What format do I get?',
    answer:
      'You get two files: a single high-resolution passport photo, and a 4×6 inch printable sheet with multiple photos arranged for easy printing at any photo printer or pharmacy.',
  },
  {
    question: 'Can I use my phone camera?',
    answer:
      'Absolutely! You can either select an existing photo from your device or take a selfie directly with your phone camera. For best results, use good lighting and a plain background.',
  },
  {
    question: 'What is your refund policy?',
    answer:
      'We offer a 30-day money-back guarantee. If your photo is rejected by a government office, contact us for a full refund.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No! Everything runs in your web browser. No apps to download, no software to install. Works on any modern smartphone, tablet, or computer.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base">
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
  );
}
