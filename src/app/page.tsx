import Image from "next/image";
import LoginForm from "@/components/login-form";
import Logo from "@/components/logo";
import { UserProvider } from "@/hooks/use-user";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const carouselSlides = [
  {
    image: {
      src: "https://picsum.photos/seed/carousel1/1920/1080",
      hint: "team collaboration",
    },
    title: "Collaborate and Conquer",
    description: "Bring your team together to achieve project milestones faster than ever.",
  },
  {
    image: {
      src: "https://picsum.photos/seed/carousel2/1920/1080",
      hint: "modern office",
    },
    title: "Visualize Your Success",
    description: "Track progress with intuitive charts and real-time data visualizations.",
  },
  {
    image: {
      src: "https://picsum.photos/seed/carousel3/1920/1080",
      hint: "data analytics",
    },
    title: "AI-Powered Insights",
    description: "Leverage artificial intelligence to streamline reviews and identify bottlenecks.",
  },
];

export default function LoginPage() {
  return (
    <UserProvider>
      <div className="w-full min-h-screen grid lg:grid-cols-2">
        <div className="relative hidden items-center justify-center bg-background lg:flex">
          <Carousel
            className="w-full h-full"
            opts={{ loop: true }}
          >
            <CarouselContent>
              {carouselSlides.map((slide, index) => (
                <CarouselItem key={index} className="relative w-full h-screen">
                    <Image
                      src={slide.image.src}
                      alt={slide.title}
                      data-ai-hint={slide.image.hint}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/80" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white p-12">
                        <Logo className="text-5xl" />
                        <h1 className="text-3xl font-bold font-headline mt-4 text-primary">
                            {slide.title}
                        </h1>
                        <p className="mt-2 max-w-md text-lg">
                            {slide.description}
                        </p>
                    </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white bg-white/20 hover:bg-white/30 border-none" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white bg-white/20 hover:bg-white/30 border-none" />
          </Carousel>
        </div>
        <div className="flex items-center justify-center p-6 min-h-screen bg-background">
            <LoginForm />
        </div>
      </div>
    </UserProvider>
  );
}
