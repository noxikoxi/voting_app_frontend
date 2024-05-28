"use client"

import {useEffect, useState} from "react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import {Wordcloud} from "@visx/wordcloud";
import {scaleLog} from "@visx/scale";
import {Text} from "@visx/text";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useMutation} from "@tanstack/react-query";
import {submitComment} from "@/app/actions";
import {io} from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "");

type ClientPageProps = {
    topicName: string
    initialData: {text: string; value:number}[]
}

const COLORS = ['#143059', '#2F6B9A', '#82A8C2'];

const ClientPage = ({topicName, initialData}: ClientPageProps) => {

    const [words, setWords] = useState(initialData);
    const [input, setInput] = useState<string>("");
    const fontScale = scaleLog({
        domain: [
            Math.min(...words.map((w) => w.value)),
            Math.max(...words.map((w) => w.value)),
        ],
        range: [10, 100]
    });

    useEffect(() => {
        socket.emit("join-room", `room:${topicName}`)
    }, []);

    useEffect(() => {
        socket.on("room-update", (message: string) => {
            console.log("room update received:", message);
            const data = JSON.parse(message) as {
                text: string,
                value: number
            }[]

            data.map((newWord) => {
                const isAlreadyIncluded = words.some((word) => word.text === newWord.text);

                if (isAlreadyIncluded) {
                    setWords((prev) => {
                        const before = prev.find((word) => word.text === newWord.text);
                        const rest = prev.filter((word) => word.text !== newWord.text);

                        return [...rest, {text: before!.text, value: before!.value + newWord.value}]
                    })
                } else if (words.length < 50) {
                    // add to state
                    setWords((prev) => [...prev, newWord]);
                }
            })
        })

        return () => {
            socket.off('room-update');
        }
    }, [words]);

    const {mutate, isPending} = useMutation({
        mutationFn: submitComment
    })

    return <div className="w-full flex flex-col items-center justify-center min-h-screen bg-grid-zinc-50 pb-20">
        <MaxWidthWrapper className="flex flex-col items-center gap-6 pt-20 text-center">
            <h1 className="text-4xl sm:text:5xl tracking-tight font-bold text-balance">
                What people think about{" "}
                <span className="text-blue-600">{topicName}</span>
                :
            </h1>
            <p className="text-sm"> (updated in real-time)</p>
            <div className="aspect-square max-w-xl items-center justify-center">
                <Wordcloud
                    width={500}
                    height={500}
                    words={words}
                    fontSize={(data) => fontScale(data.value)}
                    font={"Impact"}
                    spiral="archimedean"
                    rotate={0}
                    random={() => 0.5}
                >
                    {(cloudWords) => cloudWords.map((w, i) => (
                        <Text
                            key={w.text}
                            fill={COLORS[i % COLORS.length]}
                            textAnchor="middle"
                            transform={`translate(${w.x}, ${w.y})`}
                            fontSize={w.size}
                            fontFamily={w.font}
                        >
                            {w.text}
                        </Text>
                    ))}
                </Wordcloud>
            </div>
            <div className="max-w-lg w-full text-center md:text-left">
                <Label className="font-semibold tracking-tight text-lg pb-2">
                    Here's what I think about {topicName}
                </Label>
                <div className="mt-1 flex flex-col md:flex-row gap-2 items-center">
                    <Input
                        placeholder={`${topicName} is absolutely...`}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                    >
                    </Input>
                    <Button disabled={isPending} onClick={() => mutate({comment: input, topicName})}>
                        Share
                    </Button>
                </div>

            </div>
        </MaxWidthWrapper>
    </div>
}

export default ClientPage;